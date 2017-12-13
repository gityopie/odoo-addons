odoo.define('web_google_maps.MapView', function (require) {
    'use strict';

    var AbstractView = require('web.AbstractView');
    var core = require('web.core');
    var utils = require('web.utils');
    var MapModel = require('web_google_maps.MapModel');
    var MapController = require('web_google_maps.MapController');
    var MapRenderer = require('web_google_maps.MapRenderer');

    var _lt = core._lt;

    var MapView = AbstractView.extend({
        accesskey: 'm',
        display_name: _lt('Map'),
        icon: 'fa-map-o',
        jsLibs: [
            '//developers.google.com/maps/documentation/javascript/examples/markerclusterer/markerclusterer.js',
        ],
        config: {
            Model: MapModel,
            Controller: MapController,
            Renderer: MapRenderer,
        },
        viewType: 'map',
        init: function (viewInfo, params) {
            this._super.apply(this, arguments);

            var arch = viewInfo.arch;
            var attrs = arch.attrs;
            var fields = viewInfo.fields;

            var markerColors = ['green', 'blue', 'red', 'yellow', 'purple', 'orange', 'pink'];
            var iconUrl = '//maps.google.com/mapfiles/ms/icons/';
            var colors = this._setMarkerColors(attrs.colors);

            var mapping = {};
            var fieldNames = fields.display_name ? ['display_name'] : [];
            var displayFields = {};
            var filters = {};
            var modelFilters = [];

            _.each(arch.children, function (child) {
                if (child.tag !== 'field') return;
                var fieldName = child.attrs.name;
                fieldNames.push(fieldName);
                if (!child.attrs.invisible) {
                    displayFields[fieldName] = child.attrs;
                }
            });
            if (_.isEmpty(displayFields)) {
                displayFields = fields.display_name ? {'display_name': {}} : [];
            }

            this.rendererParams.record_options = {
                editable: false,
                deletable: false,
                read_only_mode: true
            };
            this.rendererParams.markerColor = attrs.color;
            this.rendererParams.markerColors = colors;
            this.rendererParams.fieldLat = attrs.lat;
            this.rendererParams.fieldLng = attrs.lng;
            this.rendererParams.iconColors = markerColors;
            this.rendererParams.iconUrl = iconUrl;
            this.rendererParams.displayFields = displayFields;
            this.rendererParams.model = viewInfo.model;

            this.loadParams.fieldNames = _.uniq(fieldNames);
            this.loadParams.mapping = mapping;
            this.loadParams.fields = fields;
            this.loadParams.fieldsInfo = viewInfo.fieldsInfo;
            this.loadParams.parentID = viewInfo.parentID;
            this.recordID = params.recordID;
            this.model = params.model;
        },
        _setMarkerColors: function (colors) {
            if (!colors) {
                return false;
            }
            return _(colors.split(';'))
                .chain()
                .compact()
                .map(function (color_pair) {
                    var pair = color_pair.split(':'),
                        color = pair[0],
                        expr = pair[1];
                    return [color, py.parse(py.tokenize(expr)), expr];
                }).value();
        }
    });

    return MapView;

});