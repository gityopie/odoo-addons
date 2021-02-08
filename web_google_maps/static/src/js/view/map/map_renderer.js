odoo.define('web_google_maps.MapRenderer', function (require) {
    'use strict';

    var BasicRenderer = require('web.BasicRenderer');
    var core = require('web.core');
    var QWeb = require('web.QWeb');
    var session = require('web.session');
    var utils = require('web.utils');
    var Widget = require('web.Widget');
    var KanbanRecord = require('web.KanbanRecord');
    var Utils = require('web_google_maps.Utils');

    var qweb = core.qweb;

    var MARKER_COLORS = [
        'black',
        'blue',
        'brown',
        'cyan',
        'fuchsia',
        'green',
        'grey',
        'lime',
        'maroon',
        'navy',
        'olive',
        'orange',
        'pink',
        'purple',
        'red',
        'teal',
        'white',
        'yellow',
    ];

    var MapRecord = KanbanRecord.extend({
        init: function (parent, state, options) {
            this._super.apply(this, arguments);
            this.fieldsInfo = state.fieldsInfo.google_map;
        },
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
            condition = _.str.sprintf(
                '(%s) and (%s)',
                node.attrs[qweb.prefix + '-if'],
                condition
            );
        }
        node.attrs[qweb.prefix + '-if'] = condition;
    }

    function transformQwebTemplate(node, fields) {
        // Process modifiers
        if (node.tag && node.attrs.modifiers) {
            var modifiers = node.attrs.modifiers || {};
            if (modifiers.invisible) {
                qwebAddIf(
                    node,
                    _.str.sprintf(
                        '!kanban_compute_domain(%s)',
                        JSON.stringify(modifiers.invisible)
                    )
                );
            }
        }
        switch (node.tag) {
            case 'button':
            case 'a':
                var type = node.attrs.type || '';
                if (
                    _.indexOf(
                        'action,object,edit,open,delete,url,set_cover'.split(
                            ','
                        ),
                        type
                    ) !== -1
                ) {
                    _.each(node.attrs, function (v, k) {
                        if (
                            _.indexOf(
                                'icon,type,name,args,string,context,states,kanban_states'.split(
                                    ','
                                ),
                                k
                            ) !== -1
                        ) {
                            node.attrs['data-' + k] = v;
                            delete node.attrs[k];
                        }
                    });
                    if (node.attrs['data-string']) {
                        node.attrs.title = node.attrs['data-string'];
                    }
                    if (node.tag === 'a' && node.attrs['data-type'] !== 'url') {
                        node.attrs.href = '#';
                    } else {
                        node.attrs.type = 'button';
                    }

                    var action_classes =
                        ' oe_kanban_action oe_kanban_action_' + node.tag;
                    if (node.attrs['t-attf-class']) {
                        node.attrs['t-attf-class'] += action_classes;
                    } else if (node.attrs['t-att-class']) {
                        node.attrs['t-att-class'] +=
                            " + '" + action_classes + "'";
                    } else {
                        node.attrs['class'] =
                            (node.attrs['class'] || '') + action_classes;
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
        template: 'GoogleMapView.MapViewGroupInfo',
        init: function (parent, options) {
            this._super.apply(this, arguments);
            this.groups = options.groups;
        },
    });

    var MapRenderer = BasicRenderer.extend({
        className: 'o_google_map_view',
        template: 'GoogleMapView.MapView',
        /**
         * @override
         *
         * @param {*} parent
         * @param {*} state
         * @param {*} params
         */
        init: function (parent, state, params) {
            this._super.apply(this, arguments);
            this.widgets = [];
            this.mapThemes = Utils.MAP_THEMES;

            this.qweb = new QWeb(
                session.debug,
                {
                    _s: session.origin,
                },
                false
            );
            var templates = findInNode(this.arch, function (n) {
                return n.tag === 'templates';
            });
            transformQwebTemplate(templates, state.fields);
            this.qweb.add_template(utils.json_node_to_xml(templates));
            this.recordOptions = _.extend({}, params.record_options, {
                qweb: this.qweb,
                viewType: 'google_map',
            });
            this.state = state;
            this.mapMode = params.map_mode ? params.map_mode : 'geometry';
            this._initLibraryProperties(params);
        },
        /**
         *
         * @param {*} params
         */
        _initLibraryProperties: function (params) {
            var func_name = 'set_property_' + this.mapMode;
            this[func_name].call(this, params);
        },
        /**
         *
         * @param {*} params
         */
        set_property_geometry: function (params) {
            this.defaultMarkerColor = 'red';
            this.markers = [];
            this.iconUrl = '/web_google_maps/static/src/img/markers/';
            this.fieldLat = params.fieldLat;
            this.fieldLng = params.fieldLng;
            this.markerColor = params.markerColor;
            this.markerColors = params.markerColors;
            this.markerClusterConfig = params.markerClusterConfig;
        },
        /**
         * @override
         */
        start: function () {
            this._initMap();
            return this._super();
        },
        /**
         * Style the map
         * @private
         */
        _getMapTheme: function () {
            var self = this;
            var update_map = function (style) {
                var styledMapType = new google.maps.StyledMapType(
                    self.mapThemes[style],
                    {
                        name: 'Theme',
                    }
                );
                self.gmap.setOptions({
                    mapTypeControlOptions: {
                        mapTypeIds: [
                            'roadmap',
                            'satellite',
                            'hybrid',
                            'terrain',
                            'styled_map',
                        ],
                    },
                });
                // Associate the styled map with the MapTypeId and set it to display.
                if (self.theme === 'default') return;
                self.gmap.mapTypes.set('styled_map', styledMapType);
                self.gmap.setMapTypeId('styled_map');
            };
            if (!this.theme) {
                this._rpc({
                    route: '/web/map_theme',
                }).then(function (data) {
                    if (
                        data.theme &&
                        self.mapThemes.hasOwnProperty(data.theme)
                    ) {
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
            this.$right_sidebar = this.$('.o_map_right_sidebar');
            this.$('.o_google_map_view').empty();
            this.gmap = new google.maps.Map(
                this.$('.o_google_map_view').get(0),
                {
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    minZoom: 3,
                    maxZoom: 20,
                    fullscreenControl: true,
                    mapTypeControl: true,
                }
            );
            this._getMapTheme();
            var func_name = '_post_load_map_' + this.mapMode;
            this[func_name].call(this);
        },
        /**
         *
         */
        _post_load_map_geometry: function () {
            this._initMarkerCluster();
        },
        /**
         *
         */
        _initMarkerCluster: function () {
            if (!this.markerClusterConfig.imagePath) {
                this.markerClusterConfig.imagePath = '/web_google_maps/static/lib/markercluster/img/m';
            }
            this.markerCluster = new MarkerClusterer(
                this.gmap,
                [],
                this.markerClusterConfig
            );
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

            var color,
                expression,
                result = this.defaultMarkerColor;

            for (var i = 0; i < this.markerColors.length; i++) {
                color = this.markerColors[i][0];
                expression = this.markerColors[i][1];
                if (py.PY_isTrue(py.evaluate(expression, record.evalContext))) {
                    result = color;
                    break;
                }
            }
            return result;
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
                _odooRecord: record,
            };
            if (color) {
                options.icon = this._getIconColorPath(color);
            }
            var marker = new google.maps.Marker(options);
            this.markers.push(marker);
            this._clusterAddMarker(marker);
        },
        /**
         * Get marker icon color path
         * @param {String} color
         */
        _getIconColorPath: function (color) {
            var defaultPath = '/web_google_maps/static/src/img/markers/';
            if (MARKER_COLORS.indexOf(color) >= 0) {
                return defaultPath + color + '.png';
            }
            return this.iconUrl + color + '.png';
        },
        /**
         * Handle Multiple Markers present at the same coordinates
         */
        _clusterAddMarker: function (marker) {
            var markerInClusters = this.markerCluster.getMarkers();
            var existingRecords = [];
            if (markerInClusters.length > 0) {
                var position = marker.getPosition();
                markerInClusters.forEach(function (_cMarker) {
                    if (position && position.equals(_cMarker.getPosition())) {
                        existingRecords.push(_cMarker._odooRecord);
                    }
                });
            }
            this.markerCluster.addMarker(marker);
            google.maps.event.addListener(
                marker,
                'click',
                this._markerInfoWindow.bind(this, marker, existingRecords)
            );
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
            markerDiv.className = 'o_kanban_view';

            var markerContent = document.createElement('div');
            markerContent.className = 'o_kanban_group';

            if (currentRecords.length > 0) {
                currentRecords.forEach(function (_record) {
                    _content = self._generateMarkerInfoWindow(_record);
                    markerRecords.push(_content);
                    _content.appendTo(markerContent);
                });
            }

            var markerIwContent = this._generateMarkerInfoWindow(
                marker._odooRecord
            );
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
            var self = this;
            var color = null;
            var latLng = null
            var lat = null;
            var lng = null;
            var defaultLatLng = this._getDefaultCoordinate();

            _.each(this.state.data, function (record) {
                color = self._getIconColor(record);
                lat =
                    typeof record.data[self.fieldLat] === 'number'
                        ? record.data[self.fieldLat]
                        : 0.0;
                lng =
                    typeof record.data[self.fieldLng] === 'number'
                        ? record.data[self.fieldLng]
                        : 0.0;
                if (lat === 0.0 && lng === 0.0) {
                    self._createMarker(defaultLatLng, record, color);
                } else {
                    latLng = new google.maps.LatLng(lat, lng);
                    self._createMarker(latLng, record, color);
                }
            });
        },
        /**
         * Default location
         */
        _getDefaultCoordinate: function () {
            return new google.maps.LatLng(0.0, 0.0);
        },
        /**
         * @override
         */
        _renderView: function () {
            var self = this;
            var func_name = '_map_center_' + this.mapMode;
            this._clearMarkerClusters();
            this._renderMarkers();
            this._clusterMarkers();
            return this._super
                .apply(this, arguments)
                .then(self[func_name].bind(self));
        },
        /**
         * Cluster markers
         * @private
         */
        _clusterMarkers: function () {
            this.markerCluster.addMarkers(this.markers);
        },
        /**
         * Centering map
         */
        _map_center_geometry: function (force_center) {
            var force_center = force_center || false;
            if (this.map_has_centered !== undefined && !force_center) return;

            var self = this;
            var mapBounds = new google.maps.LatLngBounds();

            _.each(this.markers, function (marker) {
                mapBounds.extend(marker.getPosition());
            });
            this.gmap.fitBounds(mapBounds);

            this.map_has_centered = true;
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
        setMarkerDraggable: function () {
            this.markers[0].setOptions({
                draggable: true,
                animation: google.maps.Animation.BOUNCE,
            });
        },
        disableMarkerDraggable: function () {
            this.markers[0].setOptions({
                draggable: false,
                animation: google.maps.Animation.DROP,
            });
        },
    });

    return {
        MapRenderer: MapRenderer,
        MapRecord: MapRecord,
    };
});
