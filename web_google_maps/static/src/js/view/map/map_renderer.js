odoo.define('web_google_maps.MapRenderer', function (require) {
    'use strict';

    var BasicRenderer = require('web.BasicRenderer');
    var core = require('web.core');
    var QWeb = require('web.QWeb');
    var session = require('web.session');
    var utils = require('web.utils');
    var Widget = require('web.Widget');
    var KanbanRecord = require('web.KanbanRecord');
    var map_utils = require('web_google_maps.Utils');

    var qweb = core.qweb;

    var MARKER_COLORS = [
        'green',
        'yellow',
        'blue',
        'light-green',
        'red',
        'magenta',
        'black',
        'purple',
        'orange',
        'pink',
        'grey',
        'brown',
        'cyan',
        'white',
    ];

    var MapRecord = KanbanRecord.extend({
        init: function (parent, state, options) {
            this._super.apply(this, arguments);
            this.fieldsInfo = state.fieldsInfo.map;
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
            condition = _.str.sprintf('(%s) and (%s)', node.attrs[qweb.prefix + '-if'], condition);
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
                    _.str.sprintf('!kanban_compute_domain(%s)', JSON.stringify(modifiers.invisible))
                );
            }
        }
        switch (node.tag) {
            case 'button':
            case 'a':
                var type = node.attrs.type || '';
                if (
                    _.indexOf('action,object,edit,open,delete,url,set_cover'.split(','), type) !==
                    -1
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

                    var action_classes = ' oe_kanban_action oe_kanban_action_' + node.tag;
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
        template: 'MapView.MapViewGroupInfo',
        init: function (parent, options) {
            this._super.apply(this, arguments);
            this.groups = options.groups;
        },
    });

    var MapRenderer = BasicRenderer.extend({
        className: 'o_map_view',
        template: 'MapView.MapView',
        /**
         * @override
         */
        init: function (parent, state, params) {
            this._super.apply(this, arguments);
            this.mapLibrary = params.mapLibrary;
            this.widgets = [];
            this.mapThemes = map_utils.MAP_THEMES;

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
                viewType: 'map',
            });
            this.state = state;
            this.shapesCache = {};
            this._initLibraryProperties(params);
        },
        _initLibraryProperties: function (params) {
            if (this.mapLibrary === 'drawing') {
                this.drawingMode = params.drawingMode || 'shape_type';
                this.drawingPath = params.drawingPath || 'shape_paths';
                this.shapesLatLng = [];
            } else if (this.mapLibrary === 'geometry') {
                this.defaultMarkerColor = 'red';
                this.markerGroupedInfo = [];
                this.markers = [];
                this.iconUrl = '/web_google_maps/static/src/img/markers/';
                this.fieldLat = params.fieldLat;
                this.fieldLng = params.fieldLng;
                this.markerColor = params.markerColor;
                this.markerColors = params.markerColors;
                this.groupedMarkerColors = _.extend([], params.iconColors);
                this.markerClusterConfig = params.markerClusterConfig;
            }
        },
        /**
         * @override
         */
        updateState: function (state) {
            this._setState(state);
            return this._super.apply(this, arguments);
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
                var styledMapType = new google.maps.StyledMapType(self.mapThemes[style], {
                    name: 'Theme',
                });
                self.gmap.setOptions({
                    mapTypeControlOptions: {
                        mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain', 'styled_map'],
                    },
                });
                //Associate the styled map with the MapTypeId and set it to display.
                if (self.theme === 'default') return;
                self.gmap.mapTypes.set('styled_map', styledMapType);
                self.gmap.setMapTypeId('styled_map');
            };
            if (!this.theme) {
                this._rpc({
                    route: '/web/google_map_theme',
                }).then(function (data) {
                    if (
                        data.theme &&
                        Object.prototype.hasOwnProperty.call(self.mapThemes, data.theme)
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
            this.$('.o_map_view').empty();
            if (!this.gmap) {
                this.gmap = new google.maps.Map(this.$('.o_map_view').get(0), {
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    minZoom: 3,
                    maxZoom: 21,
                    fullscreenControl: true,
                    mapTypeControl: true,
                });
            }
            this._getMapTheme();
            if (this.mapLibrary === 'geometry') {
                this._initMarkerCluster();
            }
            this.$right_sidebar = this.$('.o_map_right_sidebar');
        },
        _initMarkerCluster: function () {
            this.markerCluster = new MarkerClusterer(this.gmap, [], this.markerClusterConfig);
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
        _shapeInfoWindow: function (record, event) {
            var markerDiv = document.createElement('div');
            markerDiv.className = 'o_kanban_view o_kanban_grouped';

            var markerContent = document.createElement('div');
            markerContent.className = 'o_kanban_group';

            var markerIwContent = this._generateMarkerInfoWindow(record);
            markerIwContent.appendTo(markerContent);

            markerDiv.appendChild(markerContent);
            this.infoWindow.setContent(markerDiv);
            this.infoWindow.setPosition(event.latLng);
            this.infoWindow.open(this.gmap);
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
        /**
         * Default location
         */
        _getDefaultCoordinate: function () {
            return new google.maps.LatLng(0.0, 0.0);
        },
        _renderGrouped: function () {
            var self = this;
            var defaultLatLng = this._getDefaultCoordinate();
            var color, latLng, lat, lng;

            _.each(this.state.data, function (record) {
                color = self._getGroupedMarkerColor();
                record.markerColor = color;
                _.each(record.data, function (rec) {
                    lat =
                        typeof rec.data[self.fieldLat] === 'number' ? rec.data[self.fieldLat] : 0.0;
                    lng =
                        typeof rec.data[self.fieldLng] === 'number' ? rec.data[self.fieldLng] : 0.0;
                    if (lat === 0.0 && lng === 0.0) {
                        self._createMarker(defaultLatLng, rec, color);
                    } else {
                        latLng = new google.maps.LatLng(lat, lng);
                        self._createMarker(latLng, rec, color);
                    }
                });
                self.markerGroupedInfo.push({
                    title: record.value || 'Undefined',
                    count: record.count,
                    marker: self.iconUrl + record.markerColor.trim() + '.png',
                });
            });
        },
        _renderUngrouped: function () {
            var self = this;
            var defaultLatLng = this._getDefaultCoordinate();
            var color, latLng, lat, lng;

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
                    record.markerColor = color;
                    self._createMarker(latLng, record, color);
                }
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
                this.groupedMarkerColors = _.extend([], MARKER_COLORS);
                color = this.groupedMarkerColors.splice(0, 1)[0];
            }
            return color;
        },
        _drawPolygon: function (record) {
            var polygon;
            var path = record.data[this.drawingPath];
            var value = JSON.parse(path);
            if (Object.keys(value).length > 0) {
                if (this.shapesCache[record.data.id] === undefined) {
                    polygon = new google.maps.Polygon({
                        strokeColor: '#FF0000',
                        strokeOpacity: 0.85,
                        strokeWeight: 1.0,
                        fillColor: '#FF9999',
                        fillOpacity: 0.35,
                        map: this.gmap,
                    });
                    polygon.setOptions(value.options);
                    this.shapesCache[record.data.id] = polygon;
                } else {
                    polygon = this.shapesCache[record.data.id];
                    polygon.setMap(this.gmap);
                }
                this.shapesLatLng = this.shapesLatLng.concat(value.options.paths);
                polygon.addListener('click', this._shapeInfoWindow.bind(this, record));
            }
        },
        _drawCircle: function (record) {
            var circle;
            var path = record.data[this.drawingPath];
            var value = JSON.parse(path);
            if (Object.keys(value).length > 0) {
                if (this.shapesCache[record.data.id] === undefined) {
                    circle = new google.maps.Circle({
                        strokeColor: '#FF0000',
                        strokeOpacity: 0.85,
                        strokeWeight: 1.0,
                        fillColor: '#FF9999',
                        fillOpacity: 0.35,
                        map: this.gmap,
                    });
                    circle.setOptions(value.options);
                    this.shapesCache[record.data.id] = circle;
                } else {
                    circle = this.shapesCache[record.data.id];
                    circle.setMap(this.gmap);
                }
                this.shapesBounds.union(circle.getBounds());
                circle.addListener('click', this._shapeInfoWindow.bind(this, record));
            }
        },
        /**
         * Draw rectangle
         * @param {Object} record
         */
        _drawRectangle: function (record) {
            var rectangle;
            var path = record.data[this.drawingPath];
            var value = JSON.parse(path);
            if (Object.keys(value).length > 0) {
                var shapeOptions = value.options;
                if (this.shapesCache[record.data.id] === undefined) {
                    rectangle = new google.maps.Rectangle({
                        strokeColor: '#FF0000',
                        strokeOpacity: 0.85,
                        strokeWeight: 1.0,
                        fillColor: '#FF9999',
                        fillOpacity: 0.35,
                        map: this.gmap,
                    });
                    rectangle.setOptions(shapeOptions);
                    this.shapesCache[record.data.id] = rectangle;
                } else {
                    rectangle = this.shapesCache[record.data.id];
                    rectangle.setMap(this.gmap);
                }

                this.shapesBounds.union(rectangle.getBounds());
                rectangle.addListener('click', this._shapeInfoWindow.bind(this, record));
            }
        },
        /**
         * Draw shape into the map
         */
        _renderShapes: function () {
            var self = this;
            var shapesToKeep = [];
            this.shapesBounds = new google.maps.LatLngBounds();
            _.each(this.state.data, function (record) {
                if (Object.prototype.hasOwnProperty.call(record.data, 'id')) {
                    shapesToKeep.push(record.data.id.toString());
                }
                if (record.data[self.drawingMode] === 'polygon') {
                    self._drawPolygon(record);
                } else if (record.data[self.drawingMode] === 'rectangle') {
                    self._drawRectangle(record);
                } else if (record.data[self.drawingMode] === 'circle') {
                    self._drawCircle(record);
                }
            });
            this._cleanShapesInCache(shapesToKeep);
        },
        /**
         * @private
         * @param {Array} ShapesToKeep contains list of id
         * Remove shapes from the maps without deleting the shape
         * will keep those shapes in cache
         */
        _cleanShapesInCache: function (shapesToKeep) {
            _.each(this.shapesCache, function (shape, id) {
                if (shapesToKeep.indexOf(id) === -1) {
                    shape.setMap(null);
                }
            });
        },
        /**
         * @override
         */
        _renderView: function () {
            var self = this;
            if (this.mapLibrary === 'geometry') {
                this.markerGroupedInfo.length = 0;
                this._clearMarkerClusters();
                this._renderMarkers();
                this._clusterMarkers();
                return this._super
                    .apply(this, arguments)
                    .then(self._renderSidebarGroup.bind(self))
                    .then(self.mapGeometryCentered.bind(self));
            } else if (this.mapLibrary === 'drawing') {
                this.shapesLatLng.length = 0;
                this._renderShapes();
                return this._super.apply(this, arguments).then(this.mapShapesCentered.bind(this));
            }
            return this._super.apply(this, arguments);
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
        mapShapesCentered: function () {
            var mapBounds = new google.maps.LatLngBounds();
            if (!this.shapesBounds.isEmpty()) {
                mapBounds.union(this.shapesBounds);
            }
            _.each(this.shapesLatLng, function (latLng) {
                mapBounds.extend(latLng);
            });
            this.gmap.fitBounds(mapBounds);
        },
        /**
         * Centering map
         */
        mapGeometryCentered: function (force_center) {
            var self = this;
            force_center = typeof force_center !== 'undefined' ? force_center : false;
            if (this.map_has_centered !== undefined && !force_center) return;

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
        /**
         * Render a sidebar for grouped markers info
         * @private
         */
        _renderSidebarGroup: function () {
            if (this.markerGroupedInfo.length > 0) {
                this.$right_sidebar.empty().removeClass('closed').addClass('open');
                var groupInfo = new SidebarGroup(this, {
                    groups: this.markerGroupedInfo,
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
                if (groupByFieldAttrs.type === 'date' || groupByFieldAttrs.type === 'datetime') {
                    draggable = false;
                } else if (groupByFieldAttrs.readonly !== undefined) {
                    draggable = !groupByFieldAttrs.readonly;
                }
            }
            if (groupByFieldInfo) {
                if (draggable && groupByFieldInfo.readonly !== undefined) {
                    draggable = !groupByFieldInfo.readonly;
                }
            }
            this.groupedByM2O = groupByFieldAttrs && groupByFieldAttrs.type === 'many2one';
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
