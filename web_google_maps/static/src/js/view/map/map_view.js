odoo.define('web_google_maps.MapView', function (require) {
    'use strict';

    var BasicView = require('web.BasicView');
    var core = require('web.core');
    var utils = require('web.utils');
    var config = require('web.config');

    var MapModel = require('web_google_maps.MapModel');
    var MapRenderer = require('web_google_maps.MapRenderer');

    var _lt = core._lt;

    var MapView = BasicView.extend({
        accesskey: 'm',
        display_name: _lt('Map'),
        icon: 'fa-map-o',
        jsLibs: [],
        config: _.extend({}, BasicView.prototype.config, {
            Model: MapModel,
            Renderer: MapRenderer,
        }),
        viewType: 'map',
        init: function (viewInfo, params) {
            this._super.apply(this, arguments);

            var arch = viewInfo.arch;
            var attrs = arch.attrs;
            var fields = viewInfo.fields;

            var markerColors = ['green', 'blue', 'red', 'yellow', 'purple', 'orange', 'pink'];
            var iconUrl = '//maps.google.com/mapfiles/ms/icons/';
            var colors = this._setMarkersColor(attrs.colors);

            this.loadParams.openGroupByDefault = true;
            this.loadParams.type = 'list';
            // Override max limit record per view
            // I set it as 'undefined' to be able to load all records(markers) in single load
            // if you want to have a default Odoo 'limit' configuration, just remove the line below
            this.loadParams.limit = undefined;

            this.loadParams.groupBy = arch.attrs.default_group_by ? [arch.attrs.default_group_by] : (params.groupBy || []);

            this.rendererParams.arch = arch;
            this.rendererParams.markerColor = attrs.color;
            this.rendererParams.markerColors = colors;
            this.rendererParams.fieldLat = attrs.lat;
            this.rendererParams.fieldLng = attrs.lng;
            this.rendererParams.iconColors = markerColors;
            this.rendererParams.iconUrl = iconUrl;
            this.rendererParams.record_options = {
                editable: false,
                deletable: false,
                read_only_mode: params.readOnlyMode,
            };

            this.controllerParams.readOnlyMode = false;
        },
        _setMarkersColor: function (colors) {
            var pair, color, expr;
            if (!colors) {
                return false;
            }
            return _(colors.split(';'))
                .chain()
                .compact()
                .map(function (color_pair) {
                        pair = color_pair.split(':');
                        color = pair[0];
                        expr = pair[1];
                    return [color, py.parse(py.tokenize(expr)), expr];
                }).value();
        }
    });

    return MapView;

});