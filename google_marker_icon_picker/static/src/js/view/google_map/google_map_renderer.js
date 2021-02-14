odoo.define('google_marker_icon_picker.GoogleMapRenderer', function (require) {
    'use strict';

    const GoogleMapRenderer = require('web_google_maps.GoogleMapRenderer').GoogleMapRenderer;

    GoogleMapRenderer.include({
        set_property_geometry: function (params) {
            this._super(params);
            this.fieldMarkerColor = params.fieldMarkerColor;
        },
        _createMarker: function (latLng, record, color) {
            color =
                (typeof record.data[this.fieldMarkerColor] !== 'undefined' ? record.data[this.fieldMarkerColor] : color) ||
                'red';
            this._super(latLng, record, color);
        },
    });
});
