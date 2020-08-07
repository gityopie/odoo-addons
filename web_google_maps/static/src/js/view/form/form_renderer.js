odoo.define('web_google_maps.MapFormRenderer', function (require) {
    'use strict';

    var FormRenderer = require('web.FormRenderer');

    FormRenderer.include({
        init: function (parent, state, params) {
            this._super.apply(this, arguments);
            this.geo_field = Object.prototype.hasOwnProperty.call(params, 'geo_field')
                ? params.geo_field
                : false;
        },
    });
});
