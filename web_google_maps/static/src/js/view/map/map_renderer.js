odoo.define('web_google_maps.MapRenderer', function (require) {
    'use strict';

    var BasicRenderer = require('web.BasicRenderer');
    var core = require('web.core');
    var QWeb = require('web.QWeb');
    var session = require('web.session');
    var utils = require('web.utils');
    var Widget = require('web.Widget');
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

            this.markerGroupedInfo = [];
            this.fieldLat = params.fieldLat;
            this.fieldLng = params.fieldLng;
            this.color = params.markerColor;
            this.colors = params.markerColors;
            this.iconColors = params.iconColors;
            this.iconUrl = params.iconUrl;
            this.markers = [];
            this.mapThemes = params.mapThemes;

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
                this._rpc({route: '/web/map_theme'}).then(function (data) {
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
                imagePath: '/web_google_maps/static/src/img/m'
            });
            this.$right_sidebar = this.$('.o_map_right_sidebar');
        },
        /**
         * Compute marker color
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
         * @param {string} color
         */
        _createMarker: function (latLng, record, color) {
            var options = {
                position: latLng,
                map: this.gmap,
                animation: google.maps.Animation.DROP
            };
            if (color) {
                options.icon = this.iconUrl + color.trim() + '.png';
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
            var self = this,
                content = self._setMarkerInfoWindow(record);
            return function () {
                self.infoWindow.setContent(content);
                self.infoWindow.open(self.gmap, marker);
            };
        },
        /**
         * @private
         */
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
            var is_grouped = !!this.state.groupedBy.length;
            if (is_grouped) {
                this._renderGrouped(record);
            } else {
                this._renderUngrouped(record);
            }
        },
        _renderGrouped: function (record) {
            var self = this;
            var color = this._getGroupedMarkerColor();
            var latLng;

            record.markerColor = color;
            _.each(record.data, function(rec) {
                if (rec.data && (rec.data[self.fieldLat] && rec.data[self.fieldLng])) {
                    latLng = new google.maps.LatLng(rec.data[self.fieldLat], rec.data[self.fieldLng]);
                    self._createMarker(latLng, rec, color);
                }
            });
            this.markerGroupedInfo.push({
                'title': record.value || 'Undefined',
                'count': record.count,
                'marker': this.iconUrl + color.trim() + '.png'
            });
        },
        _renderUngrouped: function (record) {
            var color, latLng;
            if (record.data && (record.data[this.fieldLat] && record.data[this.fieldLng])) {
                color = this._getIconColor(record);
                latLng = new google.maps.LatLng(record.data[this.fieldLat], record.data[this.fieldLng]);
                record.markerColor = color;
                this._createMarker(latLng, record, color);
            }
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
        _renderMarkers: function () {
            return _.map(this.state.data, this._renderMarker.bind(this));
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
        }
    });

    return MapRenderer;

});