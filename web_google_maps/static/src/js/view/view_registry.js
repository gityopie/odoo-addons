odoo.define('web_google_maps.view_registry', function (require) {
    'use strict';

    var view_registry = require('web.view_registry');
    var MapView = require('web_google_maps.MapView');

    view_registry.add('map', MapView);

});
