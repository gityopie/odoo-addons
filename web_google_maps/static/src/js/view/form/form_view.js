odoo.define('web_google_maps.MapFormView', function (require) {
    'use strict';

    var pyUtils = require('web.py_utils');
    var FormView = require('web.FormView');

    FormView.include({
        init: function (viewInfo, params) {
            this._super.apply(this, arguments);
            if (this.arch.attrs.geo_field) {
                var geo_field = this.arch.attrs.geo_field
                    ? pyUtils.py_eval(this.arch.attrs.geo_field)
                    : {};
                if (
                    Object.prototype.hasOwnProperty.call(geo_field, 'lat') &&
                    Object.prototype.hasOwnProperty.call(geo_field, 'lng')
                ) {
                    this.controllerParams.geo_field = geo_field;
                }
            }
        },
    });
});