odoo.define('google_marker_dynamic_color.MapView', function (require) {
    'use strict';

    var MapView = require('web_google_maps.MapView');

    MapView.include({
        init: function (viewInfo, params) {
            this._super.apply(this, arguments);
            if (this.arch.attrs.library === 'geometry') {
                this.rendererParams.fieldMarkerColor = this.arch.attrs.color;
            }
        }
    });

});
