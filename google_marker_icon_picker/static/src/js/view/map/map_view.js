odoo.define('google_marker_dynamic_color.MapView', function (require) {
    'use strict';

    var MapView = require('web_google_maps.MapView');

    MapView.include({
        set_property_geometry: function (params) {
            this._super(params);
            this.rendererParams.fieldMarkerColor = this.arch.attrs.color;
        },
    });
});
