odoo.define('web_google_maps.MapView', function(require) {
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
            '/web_google_maps/static/lib/google/markerclusterer.js',
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
            var fields = viewInfo.fields;
            var attrs = arch.attrs;

            var fieldNames = fields.display_name ? ['display_name'] : [];
            var displayFields = {};

            _.each(arch.children, function (child) {
                if (child.tag !== 'field') return;
                var fieldName = child.attrs.name;
                fieldNames.push(fieldName);
                if (!child.attrs.invisible) {
                    displayFields[fieldName] = child.attrs;
                }
            });

            this.rendererParams.record_options = {
                editable: false,
                deletable: false,
                read_only_mode: true
            };
            this.rendererParams.model = viewInfo.model;
            this.rendererParams.eventTemplate = _.findWhere(arch.children, {'tag': 'templates'});
            this.rendererParams.arch = arch;
            this.rendererParams.displayFields = displayFields;

            this.loadParams.fieldNames = _.uniq(fieldNames);
            this.loadParams.fields = viewInfo.fields;
            this.loadParams.editable = false;
            this.loadParams.creatable = false;
            this.loadParams.hasSelectors = false;
            this.loadParams.type = 'map';
            this.loadParams.markerColor = attrs.color;
            this.loadParams.markerColors = attrs.colors;
        },
    });

    return MapView;

});
