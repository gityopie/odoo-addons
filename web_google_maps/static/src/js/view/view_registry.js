odoo.define('web_google_maps.view_registry', function (require) {
    "use strict";

    const MapView = require('web_google_maps.MapView');
    const view_registry = require('web.view_registry');

    view_registry.add('google_map', MapView);

});
