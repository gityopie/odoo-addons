odoo.define('google_marker_icon_picker.GoogleMapRenderer', function (require) {
    'use strict';

    const GoogleMapRenderer = require('web_google_maps.GoogleMapRenderer').GoogleMapRenderer;

    GoogleMapRenderer.include({
        set_property_geometry: function (params) {
            this._super(params);
            this.fieldMarkerColor = params.fieldMarkerColor;
        },
        /**
         * Overrided
         * Used dynamic color from record's color
         * @param {*} latLng
         * @param {*} record
         * @param {*} color
         * @returns GoogleMarker
         */
        _createMarker: function (latLng, record, color) {
            color =
                (typeof record.data[this.fieldMarkerColor] !== 'undefined'
                    ? record.data[this.fieldMarkerColor]
                    : color) || this.defaultMarkerColor;
            return this._super(latLng, record, color);
        },
    });
});
