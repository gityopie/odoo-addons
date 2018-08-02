odoo.define('web_google_maps.MapRenderer', function (require) {
    'use strict';

    var BasicRenderer = require('web.BasicRenderer');
    var core = require('web.core');
    var QWeb = require('web.QWeb');
    var session = require('web.session');
    var utils = require('web.utils');
    var Widget = require('web.Widget');
    var KanbanRecord = require('web.KanbanRecord');

    var qweb = core.qweb;

    var MapRecord = KanbanRecord.extend({
        init: function (parent, state, options) {
            this._super.apply(this, arguments);
            this.fieldsInfo = state.fieldsInfo.map;
        }
    });

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
                qwebAddIf(node, _.str.sprintf("!kanban_compute_domain(%s)", JSON.stringify(modifiers.invisible)));
            }
        }
        switch (node.tag) {
            case 'button':
            case 'a':
                var type = node.attrs.type || '';
                if (_.indexOf('action,object,edit,open,delete,url,set_cover'.split(','), type) !== -1) {
                    _.each(node.attrs, function (v, k) {
                        if (_.indexOf('icon,type,name,args,string,context,states,kanban_states'.split(','), k) !== -1) {
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

                    var action_classes = " oe_kanban_action oe_kanban_action_" + node.tag;
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

    var SidebarGroup = Widget.extend({
        template: 'MapViewGroupInfo',
        init: function (parent, options) {
            this._super.apply(this, arguments);
            this.groups = options.groups;
        }
    });

    var MapRenderer = BasicRenderer.extend({
        className: 'o_map_view',
        template: 'MapView',
        /**
         * @override
         */
        init: function (parent, state, params) {
            this._super.apply(this, arguments);

            this.defaultMarkerColor = 'red';
            this.markerGroupedInfo = [];
            this.fieldLat = params.fieldLat;
            this.fieldLng = params.fieldLng;
            this.markerColor = params.markerColor;
            this.markerColors = params.markerColors;
            this.iconColors = params.iconColors;
            this.iconUrl = params.iconUrl;
            this.markers = [];
            this.widgets = [];
            this.mapThemes = params.mapThemes;

            this.qweb = new QWeb(session.debug, {
                _s: session.origin
            }, false);
            var templates = findInNode(this.arch, function (n) {
                return n.tag === 'templates';
            });
            transformQwebTemplate(templates, state.fields);
            this.qweb.add_template(utils.json_node_to_xml(templates));
            this.recordOptions = _.extend({}, params.record_options, {
                qweb: this.qweb,
                viewType: 'map',
            });
            this.groupedMarkerColors = _.extend([], params.iconColors);
            this.state = state;
        },
        /**
         * @override
         */
        updateState: function (state) {
            this.state = state;
            return this._super.apply(this, arguments);
        },
        /**
         * @override
         */
        start: function () {
            this._initMap();
            return this._super.apply(this, arguments);
        },
        /**
         * Style the map
         * @private
         */
        _getMapTheme: function () {
            var self = this;
            var update_map = function (style) {
                var styledMapType = new google.maps.StyledMapType(self.mapThemes[style], {
                    name: 'Styled map'
                });
                self.gmap.setOptions({
                    mapTypeControlOptions: {
                        mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain', 'styled_map'],
                        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                        position: google.maps.ControlPosition.TOP_CENTER
                    }
                });
                //Associate the styled map with the MapTypeId and set it to display.
                self.gmap.mapTypes.set('styled_map', styledMapType);
                self.gmap.setMapTypeId('styled_map');
            }
            if (!this.theme) {
                this._rpc({
                    route: '/web/map_theme'
                }).then(function (data) {
                    if (data.theme && self.mapThemes.hasOwnProperty(data.theme)) {
                        self.theme = data.theme;
                        update_map(data.theme);
                    }
                });
            }
        },
        /**
         * Initialize map
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
                mapTypeControl: true
            });
            this._getMapTheme();
            this.markerCluster = new MarkerClusterer(this.gmap, [], {
                imagePath: '/web_google_maps/static/src/img/m',
                gridSize: 20,
                maxZoom: 17
            });
            this.$right_sidebar = this.$('.o_map_right_sidebar');
        },
        /**
         * Compute marker color
         * @param {any} record
         * @return string
         */
        _getIconColor: function (record) {
            if (this.markerColor) {
                return this.markerColor;
            }

            if (!this.markerColors) {
                return this.defaultMarkerColor;
            }

            var context = _.mapObject(_.extend({}, record.data, {
                uid: session.uid,
                current_date: moment().format('YYYY-MM-DD') // TODO: time, datetime, relativedelta
            }), function (val, key) {
                return (val instanceof Array) ? (_.last(val) || '') : val;
            });
            for (var i = 0; i < this.markerColors.length; i++) {
                var pair = this.markerColors[i];
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
         * @param {string} color
         */
        _createMarker: function (latLng, record, color) {
            var options = {
                position: latLng,
                map: this.gmap,
                animation: google.maps.Animation.DROP,
                _odooRecord: record
            };
            if (color) {
                options.icon = this.iconUrl + color.trim() + '.png';
            }
            var marker = new google.maps.Marker(options);
            this.markers.push(marker);
            this._clusterAddMarker(marker);
        },
        /**
         * Handle Multiple Markers present at the same coordinates
         */
        _clusterAddMarker: function (marker) {
            var _position;
            var markerInClusters = this.markerCluster.getMarkers();
            var existingRecords = [];
            if (markerInClusters.length > 0) {
                markerInClusters.forEach(function (_cMarker) {
                    _position = _cMarker.getPosition();
                    if (marker.getPosition().equals(_position)) {
                        existingRecords.push(_cMarker._odooRecord);
                    }
                });
            }
            this.markerCluster.addMarker(marker);
            google.maps.event.addListener(marker, 'click', this._markerInfoWindow.bind(this, marker, existingRecords));
        },
        /**
         * Marker info window
         * @param {any} marker: instance of google marker
         * @param {any} record
         * @return function
         */
        _markerInfoWindow: function (marker, currentRecords) {
            var self = this;
            var _content = '';
            var markerRecords = [];

            var markerDiv = document.createElement('div');
            markerDiv.className = 'o_kanban_view o_kanban_grouped';

            var markerContent = document.createElement('div');
            markerContent.className = 'o_kanban_group';

            if (currentRecords.length > 0) {
                currentRecords.forEach(function (_record) {
                    _content = self._generateMarkerInfoWindow(_record);
                    markerRecords.push(_content);
                    _content.appendTo(markerContent);
                });
            }

            var markerIwContent = this._generateMarkerInfoWindow(marker._odooRecord);
            markerIwContent.appendTo(markerContent);

            markerDiv.appendChild(markerContent);
            this.infoWindow.setContent(markerDiv);
            this.infoWindow.open(this.gmap, marker);
        },
        /**
         * @private
         */
        _generateMarkerInfoWindow: function (record) {
            var markerIw = new MapRecord(this, record, this.recordOptions);
            return markerIw;
        },
        /**
         * Render markers
         * @private
         * @param {Object} record
         */
        _renderMarkers: function () {
            var isGrouped = !!this.state.groupedBy.length;
            if (isGrouped) {
                this._renderGrouped();
            } else {
                this._renderUngrouped();
            }
        },
        _renderGrouped: function () {
            var self = this;
            var color;
            var latLng;

            _.each(this.state.data, function (record) {
                color = self._getGroupedMarkerColor();
                record.markerColor = color;
                _.each(record.data, function (rec) {
                    latLng = new google.maps.LatLng(rec.data[self.fieldLat], rec.data[self.fieldLng]);
                    self._createMarker(latLng, rec, color);
                });
                self.markerGroupedInfo.push({
                    'title': record.value || 'Undefined',
                    'count': record.count,
                    'marker': self.iconUrl + record.markerColor.trim() + '.png'
                });
            });
        },
        _renderUngrouped: function () {
            var self = this;
            var color;
            var latLng;

            _.each(this.state.data, function (record) {
                color = self._getIconColor(record);
                latLng = new google.maps.LatLng(record.data[self.fieldLat], record.data[self.fieldLng]);
                record.markerColor = color;
                self._createMarker(latLng, record, color);
            });
        },
        /**
         * Get color
         * @returns {string}
         */
        _getGroupedMarkerColor: function () {
            var color;
            if (this.groupedMarkerColors.length) {
                color = this.groupedMarkerColors.splice(0, 1)[0];
            } else {
                this.groupedMarkerColors = _.extend([], this.iconColors);
                color = this.groupedMarkerColors.splice(0, 1)[0];
            }
            return color;
        },
        /**
         * @override
         */
        _renderView: function () {
            var self = this;
            this.markerGroupedInfo.length = 0;
            this._clearMarkerClusters();
            this._renderMarkers();
            return this._super.apply(this, arguments)
                .then(self._renderSidebarGroup.bind(self))
                .then(self._clusterMarkers.bind(self))
                .then(self._mapCentered.bind(self));
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
            this.markers = [];
        },
        /**
         * Render a sidebar for grouped markers info
         * @private
         */
        _renderSidebarGroup: function () {
            var self = this;
            if (this.markerGroupedInfo.length > 0) {
                this.$right_sidebar.empty().removeClass('closed').addClass('open');
                var groupInfo = new SidebarGroup(this, {
                    'groups': this.markerGroupedInfo
                });
                groupInfo.appendTo(this.$right_sidebar);
            } else {
                this.$right_sidebar.empty();
                if (!this.$right_sidebar.hasClass('closed')) {
                    this.$right_sidebar.removeClass('open').addClass('closed');
                }
            }
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
            if (groupByFieldAttrs) {
                if (groupByFieldAttrs.type === "date" || groupByFieldAttrs.type === "datetime") {
                    draggable = false;
                } else if (groupByFieldAttrs.readonly !== undefined) {
                    draggable = !(groupByFieldAttrs.readonly);
                }
            }
            if (groupByFieldInfo) {
                if (draggable && groupByFieldInfo.readonly !== undefined) {
                    draggable = !(groupByFieldInfo.readonly);
                }
            }
            this.groupedByM2O = groupByFieldAttrs && (groupByFieldAttrs.type === 'many2one');
        },
    });

    return MapRenderer;

});