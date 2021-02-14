odoo.define('google_marker_icon_picker.GoogleMapView', function (require) {
    'use strict';

    const GoogleMapView = require('web_google_maps.GoogleMapView');

    GoogleMapView.include({
        set_property_geometry: function (params) {
            this._super(params);
            this.rendererParams.fieldMarkerColor = this.arch.attrs.color;
        },
    });
});
