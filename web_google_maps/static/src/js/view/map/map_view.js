odoo.define('web_google_maps.MapView', function (require) {
    'use strict';

    var BasicView = require('web.BasicView');
    var core = require('web.core');
    var utils = require('web.utils');
    var config = require('web.config');
    // var MapModel = require('web_google_maps.MapModel');
    // var MapController = require('web_google_maps.MapController');
    var MapRenderer = require('web_google_maps.MapRenderer');
    var BasicModel = require('web.BasicModel');
    var BasicController = require('web.BasicController');

    var _lt = core._lt;

    var MapView = BasicView.extend({
        accesskey: 'm',
        display_name: _lt('Map'),
        icon: 'fa-map-o',
        jsLibs: [],
        config: {
            Model: BasicModel,
            Controller: BasicController,
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
            var colors = this._setMarkersColor(attrs.colors);
            var activeActions = this.controllerParams.activeActions;
            activeActions = _.extend(activeActions, {
                group_create: arch.attrs.group_create ? JSON.parse(arch.attrs.group_create) : true,
                group_edit: arch.attrs.group_edit ? JSON.parse(arch.attrs.group_edit) : true,
                group_delete: arch.attrs.group_delete ? JSON.parse(arch.attrs.group_delete) : true,
            });


            this.loadParams.type = 'list';
            this.loadParams.groupBy = arch.attrs.default_group_by ? [arch.attrs.default_group_by] : (params.groupBy || []);

            this.rendererParams.arch = arch;
            this.rendererParams.markerColor = attrs.color;
            this.rendererParams.markerColors = colors;
            this.rendererParams.fieldLat = attrs.lat;
            this.rendererParams.fieldLng = attrs.lng;
            this.rendererParams.iconColors = markerColors;
            this.rendererParams.iconUrl = iconUrl;
            this.rendererParams.model = params.model;
            this.rendererParams.record_options = {
                editable: false,
                deletable: false,
                read_only_mode: true
            };
            this.rendererParams.column_options = {
                editable: activeActions.group_edit,
                deletable: activeActions.group_delete,
                group_creatable: activeActions.group_create && !config.device.isMobile,
                quick_create: params.isQuickCreateEnabled || false,
                hasProgressBar: false,
            };
            this.rendererParams.record_options = {
                editable: activeActions.edit,
                deletable: activeActions.delete,
                read_only_mode: params.readOnlyMode,
            };

            this.controllerParams.readOnlyMode = false;
        },
        _setMarkersColor: function (colors) {
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