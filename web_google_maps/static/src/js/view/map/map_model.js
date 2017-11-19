odoo.define('web_google_maps.MapModel', function(require) {
    'use strict';

    var AbstractModel = require('web.AbstractModel');

    var MapModel = AbstractModel.extend({
        init: function () {
            this._super.apply(this, arguments);
        }
    });

    return MapModel;

});
