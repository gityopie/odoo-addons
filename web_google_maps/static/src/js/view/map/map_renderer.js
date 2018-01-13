odoo.define('web_google_maps.MapRenderer', function (require) {
    'use strict';

    var BasicRenderer = require('web.BasicRenderer');
    var core = require('web.core');
    var QWeb = require('web.QWeb');
    var session = require('web.session');
    var utils = require('web.utils');
    var MapRecord = require('web_google_maps.MapRecord');

    var qweb = core.qweb;

    function findInNode(node, predicate) {
        if (predicate(node)) {
            return node;
        }
        if (!node.children) {
            return undefined;
        }
        for (var i = 0; i < node.children.length; i++) {
            if (findInNode(node.children[i], predicate)) {
                return node.children[i];
            }
        }
    }

    function qwebAddIf(node, condition) {
        if (node.attrs[qweb.prefix + '-if']) {
            condition = _.str.sprintf("(%s) and (%s)", node.attrs[qweb.prefix + '-if'], condition);
        }
        node.attrs[qweb.prefix + '-if'] = condition;
    }

    function transformQwebTemplate(node, fields) {
        // Process modifiers
        if (node.tag && node.attrs.modifiers) {
            var modifiers = node.attrs.modifiers || {};
            if (modifiers.invisible) {
                qwebAddIf(node, _.str.sprintf("!map_compute_domain(%s)", JSON.stringify(modifiers.invisible)));
            }
        }
        switch (node.tag) {
            case 'button':
            case 'a':
                var type = node.attrs.type || '';
                if (_.indexOf('action,object,edit,open,delete,url,set_cover'.split(','), type) !== -1) {
                    _.each(node.attrs, function (v, k) {
                        if (_.indexOf('icon,type,name,args,string,context,states,map_states'.split(','), k) !== -1) {
                            node.attrs['data-' + k] = v;
                            delete(node.attrs[k]);
                        }
                    });
                    if (node.attrs['data-string']) {
                        node.attrs.title = node.attrs['data-string'];
                    }
                    if (node.tag === 'a' && node.attrs['data-type'] !== "url") {
                        node.attrs.href = '#';
                    } else {
                        node.attrs.type = 'button';
                    }

                    var action_classes = " oe_map_action oe_map_action_" + node.tag;
                    if (node.attrs['t-attf-class']) {
                        node.attrs['t-attf-class'] += action_classes;
                    } else if (node.attrs['t-att-class']) {
                        node.attrs['t-att-class'] += " + '" + action_classes + "'";
                    } else {
                        node.attrs['class'] = (node.attrs['class'] || '') + action_classes;
                    }
                }
                break;
        }
        if (node.children) {
            for (var i = 0, ii = node.children.length; i < ii; i++) {
                transformQwebTemplate(node.children[i], fields);
            }
        }
    }

    var MapRenderer = BasicRenderer.extend({
        className: 'o_map_view',
        template: 'MapView',
        /**
         * @override
         */
        init: function (parent, state, params) {
            this._super.apply(this, arguments);

            this.widgets = [];
            this.fieldLat = params.fieldLat;
            this.fieldLng = params.fieldLng;
            this.color = params.markerColor;
            this.colors = params.markerColors;
            this.iconColors = params.iconColors;
            this.iconUrl = params.iconUrl;
            this.markers = [];

            this.qweb = new QWeb(session.debug, {
                _s: session.origin
            });
            var templates = findInNode(this.arch, function (n) {
                return n.tag === 'templates';
            });
            transformQwebTemplate(templates, state.fields);
            this.qweb.add_template(utils.json_node_to_xml(templates));
            this.recordOptions = _.extend({}, params.record_options, {
                qweb: this.qweb,
                viewType: 'map',
            });
            this.columnOptions = _.extend({}, params.column_options, { qweb: this.qweb });
            this._setState(state);
        },
        /**
         * @override
         */
        updateState: function (state) {
            this._setState(state);
            return this._super.apply(this, arguments);
        },
        /**
         * Initialize map
         * @override
         */
        start: function () {
            this._initMap();
            return this._super.apply(this, arguments);
        },
        /**
         * draw map
         * @private
         */
        _initMap: function () {
            this.infoWindow = new google.maps.InfoWindow();
            this.$('.o_map_view').empty();
            this.gmap = new google.maps.Map(this.$('.o_map_view').get(0), {
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                zoom: 3,
                minZoom: 3,
                maxZoom: 20,
                fullscreenControl: true,
                mapTypeControl: true,
                mapTypeControlOptions: {
                    style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                    position: google.maps.ControlPosition.TOP_CENTER
                }
            });
            this.markerCluster = new MarkerClusterer(this.gmap, null, {
                imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
            });
        },
        /**
         * Defining marker color
         * @param {any} record
         * @return string
         */
        _getIconColor: function (record) {
            if (this.color) {
                return this.color;
            }

            if (!this.colors) {
                return '';
            }

            var context = _.mapObject(_.extend({}, record.data, {
                uid: session.uid,
                current_date: moment().format('YYYY-MM-DD') // TODO: time, datetime, relativedelta
            }), function (val, key) {
                return (val instanceof Array) ? (_.last(val) || '') : val;
            });
            for (var i = 0; i < this.colors.length; i++) {
                var pair = this.colors[i];
                var color = pair[0];
                var expression = pair[1];
                if (py.PY_isTrue(py.evaluate(expression, context))) {
                    return color;
                }
                // TODO: handle evaluation errors
            }
            return '';
        },
        /**
         * Create marker
         * @param {any} latLng: instance of google LatLng
         * @param {any} record
         */
        _createMarker: function (latLng, record) {
            var options = {
                position: latLng,
                map: this.gmap,
                animation: google.maps.Animation.DROP,
                icon: this.iconUrl + 'red-dot.png'
            };
            var color = this._getIconColor(record);
            if (color && this.iconColors.indexOf(color) !== -1) {
                options.icon = this.iconUrl + color + '-dot.png';
            }
            var marker = new google.maps.Marker(options);
            this.markers.push(marker);
            google.maps.event.addListener(marker, 'click', this._markerInfoWindow(marker, record));
        },
        /**
         * Marker info window
         * @param {any} marker: instance of google marker
         * @param {any} record
         * @return function
         */
        _markerInfoWindow: function (marker, record) {
            var self = this;
            return function () {
                var content = self._setMarkerInfoWindow(record);
                self.infoWindow.setContent(content);
                self.infoWindow.open(self.gmap, marker);
            };
        },
        _setMarkerInfoWindow: function (record) {
            var el_div = document.createElement('div');
            var markerIw = new MapRecord(this, record, this.recordOptions);
            markerIw.appendTo(el_div);
            return el_div;
        },
        /**
         * Render a marker, corresponding to a record
         * @private
         * @param {Object} record
         */
        _renderMarker: function (record) {
            if (record.data && (record.data[this.fieldLat] && record.data[this.fieldLng])) {
                var latLng = new google.maps.LatLng(record.data[this.fieldLat], record.data[this.fieldLng]);
                this._createMarker(latLng, record);
            }
        },
        _renderMarkers: function () {
            return _.map(this.state.data, this._renderMarker.bind(this));
        },
        _renderView: function () {
            var self = this;
            this._clearMarkerClusters();
            this._renderMarkers();

            return this._super.apply(this, arguments).then(self._clusterMarkers.bind(self)).then(self._mapCentered.bind(self));
        },
        _renderGrouped: function () {
            var self = this;
            // Render columns
            _.each(this.state.data, function (group) {
                var column = new KanbanColumn(self, group, self.columnOptions, self.recordOptions);
                if (!group.value) {
                    self.widgets.unshift(column);
                } else {
                    self.widgets.push(column);
                }
            });
        },
        _renderUngrouped: function () {
            var self = this;
            _.each(this.state.data, function (record) {
                self.widgets.push(record);
            });
        },
        /**
         * Cluster markers
         * @private
         */
        _clusterMarkers: function () {
            this.markerCluster.addMarkers(this.markers);
        },
        /**
         * Center map
         * @private
         */
        _mapCentered: function () {
            var self = this;
            var mapBounds = new google.maps.LatLngBounds();

            _.each(this.markers, function (marker) {
                mapBounds.extend(marker.getPosition());
            });
            this.gmap.fitBounds(mapBounds);

            google.maps.event.addListenerOnce(this.gmap, 'idle', function () {
                google.maps.event.trigger(self.gmap, 'resize');
                if (self.gmap.getZoom() > 17) self.gmap.setZoom(17);
            });
        },
        /**
         * Clear marker clusterer and list markers
         * @private
         */
        _clearMarkerClusters: function () {
            this.markerCluster.clearMarkers();
            this.markers.length = 0;
        },
        /**
         * Sets the current state and updates some internal attributes accordingly.
         *
         * @private
         * @param {Object} state
         */
        _setState: function (state) {
            this.state = state;

            var groupByFieldAttrs = state.fields[state.groupedBy[0]];
            var groupByFieldInfo = state.fieldsInfo.map[state.groupedBy[0]];
            // Deactivate the drag'n'drop if the groupedBy field:
            // - is a date or datetime since we group by month or
            // - is readonly (on the field attrs or in the view)
            var draggable = false;
            this.groupedByM2O = groupByFieldAttrs && (groupByFieldAttrs.type === 'many2one');
            var grouped_by_field = this.groupedByM2O && groupByFieldAttrs.relation;
            var groupByTooltip = groupByFieldInfo && groupByFieldInfo.options.group_by_tooltip;
            this.columnOptions = _.extend(this.columnOptions, {
                draggable: draggable,
                group_by_tooltip: groupByTooltip,
                grouped_by_m2o: this.groupedByM2O,
                relation: grouped_by_field,
            });
            this.createColumnEnabled = this.groupedByM2O && true;
        },
        /**
         * Updates a given record with its new state.
         *
         * @param {Object} recordState
         */
        updateRecord: function (recordState) {
            var isGrouped = !!this.state.groupedBy.length;
            var record;

            if (isGrouped) {
                // if grouped, this.widgets are kanban columns so we need to find
                // the kanban record inside
                _.each(this.widgets, function (widget) {
                    record = record || _.findWhere(widget.records, {
                        db_id: recordState.id,
                    });
                });
            } else {
                record = _.findWhere(this.widgets, {
                    db_id: recordState.id
                });
            }
            console.log(' record = ', record);
            if (record) {
                record.update(recordState);
            }
        },
        /**
         * Removes a widget (record if ungrouped, column if grouped) from the view.
         *
         * @param {Widget} widget the instance of the widget to remove
         */
        removeWidget: function (widget) {
            this.widgets.splice(this.widgets.indexOf(widget), 1);
            widget.destroy();
        },
    });

    return MapRenderer;

});