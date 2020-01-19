odoo.define('google_marker_dynamic_color.MapRenderer', function (require) {
    'use strict';

    var MapRenderer = require('web_google_maps.MapRenderer');
    var MARKER_COLORS = [
        'aqua', 'blue-violet', 'blue', 'brown', 'deep-sky-blue', 'fuschia',
        'gold', 'gray', 'green', 'indigo', 'lime-green', 'lime', 'maroon',
        'navy', 'olive', 'orange', 'purple', 'red', 'teal', 'yellow'
    ];

    MapRenderer.include({
        _initLibraryProperties: function (params) {
            this._super.apply(this, arguments);
            if (this.mapLibrary === 'geometry') {
                this.fieldMarkerColor = params.fieldMarkerColor;
                this.iconUrl = '/google_marker_icon_picker/static/src/img/markers/';
            }
        },
        _createMarker: function (latLng, record, color) {
            var color = (record.data[this.fieldMarkerColor] ? record.data[this.fieldMarkerColor] : color) || 'red';
            this._super(latLng, record, color);
        },
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
    });

});