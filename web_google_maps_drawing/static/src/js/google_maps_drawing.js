odoo.define('web_google_maps_drawing.MapDrawing', function (require) {
    'use strict';

    var core = require('web.core');
    var rpc = require('web.rpc');
    var MapRenderer = require('web_google_maps.MapRenderer');
    var MapView = require('web_google_maps.MapView');
    var MapController = require('web_google_maps.MapController');

    var qweb = core.qweb;

    MapController.include({
        custom_events: _.extend({}, MapController.prototype.custom_events, {
            update_draw_shape: '_onUpdateDrawing'
        }),
        _onUpdateDrawing: function (ev) {
            console.log('_onUpdateDrawing...');
            var changes = _.clone(ev.data);
            console.log(changes);
        }
    });

    MapView.include({
        init: function (viewInfo, params) {
            this._super.apply(this, arguments);
            var arch = viewInfo.arch;
            var attrs = arch.attrs;
            this.rendererParams.drawing = 'drawing' in attrs ? true : false;
        }
    });

    MapRenderer.include({
        init: function (parent, state, params) {
            this._super.apply(this, arguments);
            this.selectedShapes = {};
            this.drawing = params.drawing;
        },
        _initMap: function () {
            this._super.apply(this, arguments);
            this._initDrawing();
        },
        _initDrawing: function () {
            if (this.drawing && !this.recordOptions.read_only_mode) {
                var defaultColor = '#006ee5';
                var drawingOptions = {
                    fillColor: defaultColor,
                    strokeWeight: 0,
                    fillOpacity: 0.45,
                    editable: true
                };
                var polylineOptions = {
                    strokeColor: defaultColor,
                    strokeWeight: 2
                };
                var circleOptions = {
                    fillColor: defaultColor,
                    fillOpacity: 0.45,
                    strokeWeight: 0,
                    editable: true,
                    zIndex: 1
                };
                this.gmapDrawingManager = new google.maps.drawing.DrawingManager({
                    drawingMode: google.maps.drawing.OverlayType.POLYGON,
                    drawingControl: true,
                    drawingControlOptions: {
                        position: google.maps.ControlPosition.BOTTOM_CENTER,
                        drawingModes: ['circle', 'polygon', 'polyline', 'rectangle']
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
                google.maps.event.addListener(this.gmapDrawingManager, 'overlaycomplete', this._drawingCompleted.bind(this));
                google.maps.event.addListener(this.gmapDrawingManager, 'drawingmode_changed', this._clearSelectedShape.bind(this));
                google.maps.event.addListener(this.gmap, 'click', this._clearSelectedShape.bind(this));

                this._loadDrawingActionButton();
            }
        },
        _drawingCompleted: function (event) {
            this.gmapDrawingManager.setDrawingMode(null);

            var newShape = event.overlay;
            var uniqueId = new Date().getTime();

            newShape.type = event.type;
            newShape._drawId = uniqueId

            this.selectedShapes[uniqueId] = newShape;
            google.maps.event.addListener(newShape, 'click', this._setSelectedShape.bind(this, newShape));
            this._setSelectedShape(newShape);
        },
        _setSelectedShape: function (newShape) {
            console.log('_setSelectedShape');
            this.selectedShape = newShape;
            this.selectedShape.setEditable(true);
        },
        _clearSelectedShape: function () {
            console.log('_clearSelectedShape');
            if (this.selectedShape) {
                this.selectedShape.setEditable(false);
                this.selectedShape = null;
            }
        },
        _loadDrawingActionButton: function () {
            var self = this;
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
        _commitShapeDraw: function (event) {
            event.preventDefault();
            var values = {
                'mode': this.selectedShape.type
            };
            if (this.selectedShape.type === 'rectangle') {
                var bounds = this.selectedShape.getBounds();
                values['bounds'] = bounds.toJSON();
            } else if (this.selectedShape.type == 'circle') {
                var radius = this.selectedShape.getRadius();
                values['radius'] = radius;
            } else {
                var paths = this.selectedShape.getPath();
                // var area = google.maps.geometry.spherical.computeArea(paths);
                var paths_latLng = [];
                paths.forEach(function (item) {
                    paths_latLng.push({
                        'lat': item.lat(),
                        'lng': item.lng()
                    });
                });
                values['path'] = paths_latLng;
            };
            this._actionCreateShape(values);
        },
        _deleteSelectedShaped: function (event) {
            event.preventDefault();
            if (this.selectedShape) {
                delete this.selectedShapes[this.selectedShape._drawId];
                this.selectedShape.setMap(null);
            }
        },
        _actionCreateShape: function (values) {
            console.log(' _actionCreateShape!');
            console.log(values);
            this.trigger_up('update_draw_shape', values);
        }
    });

});