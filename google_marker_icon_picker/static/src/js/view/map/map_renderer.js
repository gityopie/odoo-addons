odoo.define('google_marker_dynamic_color.MapRenderer', function (require) {
    'use strict';

    var MapRenderer = require('web_google_maps.MapRenderer');

    var MARKER_COLORS = [
        'aqua', 'blue-violet', 'blue', 'brown',
        'red', 'maroon', 'deep-sky-blue', 'fuschia', 'gold',
        'gray', 'green', 'indigo', 'lime-green', 'lime', 'navy', 'olive',
        'orange', 'purple', 'teal', 'yellow'
    ];

    MapRenderer.include({
        _getGroupedMarkerColor: function () {
            if (this.groupedMarkerColors.length === 0) {
                this.groupedMarkerColors = _.extend([], MARKER_COLORS);
            }
            var color = this.groupedMarkerColors.splice(0, 1);
            return color[0];
        },
        set_property_geometry: function (params) {
            this._super(params);
            this.fieldMarkerColor = params.fieldMarkerColor;
            this.iconUrl = '/google_marker_icon_picker/static/src/img/markers/';
            this.groupedMarkerColors = _.extend([], MARKER_COLORS);
        },
        _createMarker: function (latLng, record, color) {
            color = (record.data[this.fieldMarkerColor] ? record.data[this.fieldMarkerColor] : color) || 'red';
            this._super(latLng, record, color);
        },
    });

});