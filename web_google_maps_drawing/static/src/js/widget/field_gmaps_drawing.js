odoo.define('widget_google_maps_drawing.FieldMapDrawingShape', function (require) {
    'use strict';

    var core = require('web.core');
    var BasicFields = require('web.basic_fields');
    var _t = core._t;
    var qweb = core.qweb;

    var FieldMapDrawingShape = BasicFields.InputField.extend({
        class: 'o_field_text o_field_map_drawing',
        tagName: 'div',
        template: 'WidgetDrawing.Map',
        supportedFieldTypes: ['text'],
        init: function () {
            this._super.apply(this, arguments);
            this.selectedShapes = {};
            this.editModeColor = '#006ee5';
        },
        /**
         * Override
         */
        start: function () {
            this._initMap();
            return this._super();
        },
        /**
         * @private
         * Initialize map
         */
        _initMap: function () {
            this.gmap = new google.maps.Map(this.$('.o_map_view').get(0), {
                center: {
                    lat: -34.397,
                    lng: 150.644
                },
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                zoom: 3,
                minZoom: 3,
                maxZoom: 20,
                fullscreenControl: true,
                mapTypeControl: true,
                mapTypeControlOptions: {
                    mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
                    style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                    position: google.maps.ControlPosition.TOP_CENTER
                }
            });
        },
        /**
         * @private
         * Initialize drawing manager
         */
        _initDrawing: function (mode) {
            var drawingOptions = {
                fillColor: this.editModeColor,
                strokeWeight: 0,
                fillOpacity: 0.45,
                editable: true
            };
            var polylineOptions = {
                strokeColor: this.editModeColor,
                strokeWeight: 2
            };
            var circleOptions = {
                fillColor: this.editModeColor,
                fillOpacity: 0.45,
                strokeWeight: 0,
                editable: true,
                zIndex: 1
            };
            this.gmapDrawingManager = new google.maps.drawing.DrawingManager({
                drawingControl: true,
                drawingControlOptions: {
                    position: google.maps.ControlPosition.BOTTOM_CENTER,
                    drawingModes: ['circle', 'polygon', 'rectangle']
                },
                map: this.gmap,
                polylineOptions: {
                    editable: true
                },
                rectangleOptions: drawingOptions,
                polygonOptions: drawingOptions,
                circleOptions: circleOptions,
                polylineOptions: polylineOptions
            });
            google.maps.event.addListener(this.gmapDrawingManager, 'overlaycomplete', this._overlayCompleted.bind(this));
            google.maps.event.addListener(this.gmapDrawingManager, 'drawingmode_changed', this._clearSelectedShape.bind(this));
            google.maps.event.addListener(this.gmap, 'click', this._clearSelectedShape.bind(this));
            this._loadDrawingActionButton();
            this._loadShapeExisted();
        },
        /**
         * @private
         * Draw existed shape
         */
        _loadShapeExisted: function () {
            var value = this._formatValue(this.value);
            if (value) {
                value = JSON.parse(value);
                if (value.type === 'polygon') {
                    var polygon = this._drawPolygon(value.options);
                    polygon.setOptions({
                        editable: true,
                        strokeColor: this.editModeColor,
                        fillColor: this.editModeColor,
                    });
                    var selectedShape = polygon;
                    selectedShape.type = 'polygon';
                    this._setSelectedShape(selectedShape);
                    google.maps.event.addListener(selectedShape, 'click', this._setSelectedShape.bind(this, selectedShape));
                } else if (value.type === 'rectangle') {
                    var rectangle = this._drawRectangle(value.options);
                    rectangle.setOptions({
                        editable: true,
                        draggable: true,
                        strokeColor: this.editModeColor,
                        fillColor: this.editModeColor,
                    });
                    var selectedShape = rectangle;
                    selectedShape.type = 'rectangle';
                    this._setSelectedShape(selectedShape);
                    google.maps.event.addListener(selectedShape, 'click', this._setSelectedShape.bind(this, selectedShape));
                } else if (value.type === 'circle') {
                    var circle = this._drawCircle(value.options);
                    circle.setOptions({
                        editable: true,
                        draggable: true,
                        strokeColor: this.editModeColor,
                        fillColor: this.editModeColor,
                    });
                    var selectedShape = circle;
                    selectedShape.type = 'circle';
                    this._setSelectedShape(selectedShape);
                    google.maps.event.addListener(selectedShape, 'click', this._setSelectedShape.bind(this, selectedShape));
                }
            }
        },
        /**
         * @private
         * Draw polygon
         */
        _drawPolygon: function (options) {
            var self = this;
            var polygon = new google.maps.Polygon({
                strokeColor: '#FF0000',
                strokeOpacity: 0.85,
                strokeWeight: 1.0,
                fillColor: '#FF9999',
                fillOpacity: 0.35,
                editable: false,
                map: this.gmap,
            });
            polygon.setOptions(options);
            window.setTimeout(function () {
                self._mapCenterMap(options.paths);
            }, 1000);
            return polygon;
        },
        /**
         * @private
         * Draw rectangle
         */
        _drawRectangle: function (options) {
            var self = this;
            var rectangle = new google.maps.Rectangle({
                strokeColor: '#FF0000',
                strokeOpacity: 0.85,
                strokeWeight: 1.0,
                fillColor: '#FF9999',
                fillOpacity: 0.35,
                map: this.gmap,
                editable: false,
                draggable: false
            });
            rectangle.setOptions(options);
            window.setTimeout(function () {
                self._mapCenterMap(false, rectangle.getBounds());
            }, 1000);
            return rectangle;
        },
        /**
         * @private
         * Draw circle
         */
        _drawCircle: function (options) {
            var self = this;
            var circle = new google.maps.Circle({
                strokeColor: '#FF0000',
                strokeOpacity: 0.85,
                strokeWeight: 1.0,
                fillColor: '#FF9999',
                fillOpacity: 0.35,
                map: this.gmap,
                editable: false,
                draggable: false
            });
            circle.setOptions(options);
            window.setTimeout(function () {
                self._mapCenterMap(false, circle.getBounds());
            }, 1000);
            return circle;
        },
        /**
         * @override
         */
        _renderReadonly: function () {
            var value = this._formatValue(this.value);
            if (value) {
                var shapePath = JSON.parse(value);
                var shapeOptions = shapePath.options;
                if (shapePath.type === 'polygon') {
                    this._drawPolygon(shapeOptions);
                } else if (shapePath.type === 'rectangle') {
                    this._drawRectangle(shapeOptions);
                } else if (shapePath.type === 'circle') {
                    this._drawCircle(shapeOptions);
                }
            }
        },
        /**
         * @override 
         */
        _renderEdit: function () {
            this._super.apply(this, arguments);
            this._initDrawing();
        },
        /**
         * @private
         * Callback function when overlay is completed
         */
        _overlayCompleted: function (event) {
            // Switch back to non-drawing mode after drawing a shape.
            this.gmapDrawingManager.setDrawingMode(null);

            var newShape = event.overlay;
            var uniqueId = new Date().getTime();

            newShape.type = event.type;
            newShape._drawId = uniqueId;

            this.selectedShapes[uniqueId] = newShape;
            google.maps.event.addListener(newShape, 'click', this._setSelectedShape.bind(this, newShape));
            this._setSelectedShape(newShape);
        },
        /**
         * @private
         * Set selected shape
         */
        _setSelectedShape: function (newShape) {
            this.selectedShape = newShape;
            this.selectedShape.setEditable(true);
        },
        /**
         * @private
         * Clear selected shape
         */
        _clearSelectedShape: function () {
            if (this.selectedShape) {
                this.selectedShape.setEditable(false);
                this.selectedShape = null;
            }
        },
        /**
         * @private
         * Load action buttons into the map
         */
        _loadDrawingActionButton: function () {
            if (this.$btnDrawingCommit === undefined) {
                this.$btnDrawingCommit = $(qweb.render('WidgetDrawing.BtnCommit', {
                    widget: this
                }));
                this.gmap.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(this.$btnDrawingCommit.get(0));
                this.$btnDrawingCommit.on('click', this._commitShapeDraw.bind(this));
            }
            if (this.$btnDrawingClear === undefined) {
                this.$btnDrawingClear = $(qweb.render('WidgetDrawing.BtnDelete', {
                    widget: this
                }));
                this.gmap.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(this.$btnDrawingClear.get(0));
                this.$btnDrawingClear.on('click', this._deleteSelectedShaped.bind(this));
            }
        },
        /**
         * @private
         */
        _commitShapeDraw: function (event) {
            event.preventDefault();
            event.stopPropagation();
            var values = {
                'shape_type': this.selectedShape.type,
            };
            var shape_paths = {};
            if (this.selectedShape.type === 'rectangle') {
                var bounds = this.selectedShape.getBounds();
                var directions = bounds.toJSON();
                shape_paths['type'] = this.selectedShape.type;
                shape_paths['options'] = {
                    bounds: directions
                };
            } else if (this.selectedShape.type == 'circle') {
                var radius = this.selectedShape.getRadius();
                var center = this.selectedShape.getCenter();
                values['shape_radius'] = radius;

                shape_paths['type'] = this.selectedShape.type;
                shape_paths['options'] = {
                    radius: radius,
                    center: {
                        'lat': center.lat(),
                        'lng': center.lng()
                    }
                };
            } else {
                var paths = this.selectedShape.getPath();
                var area = google.maps.geometry.spherical.computeArea(paths);
                var paths_latLng = [];
                paths.forEach(function (item) {
                    paths_latLng.push({
                        'lat': item.lat(),
                        'lng': item.lng()
                    });
                });
                values['shape_area'] = area;
                shape_paths['type'] = this.selectedShape.type;
                shape_paths['options'] = {
                    paths: paths_latLng
                };
            };
            if (Object.keys(this.selectedShapes).length > 1) {
                this.do_warn(_t('Only one shape is allowed!'));
            } else {
                values['shape_paths'] = JSON.stringify(shape_paths);
                this.trigger_up('field_changed', {
                    dataPointID: this.dataPointID,
                    changes: values,
                    viewType: this.viewType
                });
            }
        },
        _deleteSelectedShaped: function (event) {
            event.preventDefault();
            if (this.selectedShape) {
                delete this.selectedShapes[this.selectedShape._drawId];
                this.selectedShape.setMap(null);
            }
        },
        _mapCenterMap: function (paths, bounds) {
            paths = paths || false;
            bounds = bounds || false;
            var mapBounds = new google.maps.LatLngBounds();
            if (paths) {
                _.each(paths, function (latLng) {
                    mapBounds.extend(latLng);
                });
            } else if (bounds) {
                mapBounds.union(bounds);
            }
            this.gmap.fitBounds(mapBounds);
        },
    });

    return FieldMapDrawingShape;

});