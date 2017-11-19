odoo.define('web_google_maps.MapController', function(require) {
    'use strict';

    var AbstractController = require('web.AbstractController');
    var core = require('web.core');
    var Context = require('web.Context');

    var _t = core._t;
    var qweb = core.qweb;


    var MapController = AbstractController.extend({
        init: function (parent, model, renderer, params) {
            this._super.apply(this, arguments);
        }
    });

    return MapController;
});
