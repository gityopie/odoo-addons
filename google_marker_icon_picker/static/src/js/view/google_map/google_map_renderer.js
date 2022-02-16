odoo.define('google_marker_icon_picker.GoogleMapRenderer', function (require) {
    'use strict';

    const GoogleMapRenderer = require('web_google_maps.GoogleMapRenderer').GoogleMapRenderer;

    GoogleMapRenderer.include({
        set_property_geometry: function (params) {
            this._super(params);
            this.fieldMarkerColor = params.fieldMarkerColor;
        },
        _createMarker: function (latLng, record, color) {
            const marker_color = this.fieldMarkerColor || this.markerColor;
            if (marker_color && typeof record.data[marker_color] !== 'undefined') {
                color = record.data[marker_color] || color || this.defaultMarkerColor;
            }
            this._super(latLng, record, color);
        },
    });
});
