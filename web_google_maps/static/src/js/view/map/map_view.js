odoo.define('web_google_maps.MapView', function (require) {
    'use strict';

    var BasicView = require('web.BasicView');
    var core = require('web.core');
    var utils = require('web.utils');
    var MapRenderer = require('web_google_maps.MapRenderer');

    var _lt = core._lt;

    var MapView = BasicView.extend({
        accesskey: 'm',
        display_name: _lt('Map'),
        icon: 'fa-map-o',
        jsLibs: [
            '//developers.google.com/maps/documentation/javascript/examples/markerclusterer/markerclusterer.js',
            '//maps.googleapis.com/maps/api/js?key=AIzaSyCnIWC27gJofPgEwWMy8NnJLOOCDxAKGYk&amp;libraries=geometry,places'
        ],
        config: _.extend({}, BasicView.prototype.config, {
            Renderer: MapRenderer,
        }),
        viewType: 'map',
        init: function (viewInfo, params) {
            this._super.apply(this, arguments);

            var arch = viewInfo.arch;
            var attrs = arch.attrs;
            var markerColors = ['green', 'blue', 'red', 'yellow', 'purple', 'orange', 'pink'];
            var iconUrl = '//maps.google.com/mapfiles/ms/icons/';
            var colors = this._setMarkerColors(attrs.colors);

            this.rendererParams.record_options = {
                editable: false,
                deletable: false,
                read_only_mode: true
            };
            this.rendererParams.markerColor = attrs.color;
            this.rendererParams.markerColors = colors;
            this.rendererParams.fieldLat = attrs.lat;
            this.rendererParams.fieldLng = attrs.lng;
            this.rendererParams.iconColors = markerColors;
            this.rendererParams.iconUrl = iconUrl;
        },
        _setMarkerColors: function (colors) {
            if (!colors) {
                return false;
            }
            return _(colors.split(';'))
                .chain()
                .compact()
                .map(function (color_pair) {
                    var pair = color_pair.split(':'),
                        color = pair[0],
                        expr = pair[1];
                    return [color, py.parse(py.tokenize(expr)), expr];
                }).value();
        }
    });

    return MapView;

});