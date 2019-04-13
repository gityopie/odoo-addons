odoo.define('google_marker_dynamic_color.MapRenderer', function (require) {
    'use strict';

    var MapRenderer = require('web_google_maps.MapRenderer');

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
    });

});