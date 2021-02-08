odoo.define('web_google_maps.MapView', function (require) {
    'use strict';

    var BasicView = require('web.BasicView');
    var core = require('web.core');
    var pyUtils = require('web.py_utils');

    var MapModel = require('web_google_maps.MapModel');
    var MapRenderer = require('web_google_maps.MapRenderer').MapRenderer;
    var MapController = require('web_google_maps.MapController');

    var _lt = core._lt;

    var MapView = BasicView.extend({
        accesskey: 'm',
        display_name: _lt('Map'),
        icon: 'fa-map-o',
        config: _.extend({}, BasicView.prototype.config, {
            Model: MapModel,
            Renderer: MapRenderer,
            Controller: MapController,
        }),
        viewType: 'google_map',
        mobile_friendly: true,
        _map_mode: function () {
            return ['geometry'];
        },
        init: function (viewInfo, params) {
            this._super.apply(this, arguments);

            var arch = this.arch;
            var attrs = arch.attrs;
            var activeActions = this.controllerParams.activeActions;

            this.loadParams.limit = this.loadParams.limit || 80;
            this.loadParams.type = 'list';

            var modes = this._map_mode();
            var defaultMode = 'geometry';
            var map_mode = attrs.mode
                ? modes.indexOf(attrs.mode) > -1
                    ? attrs.mode
                    : defaultMode
                : defaultMode;
            this.rendererParams.arch = arch;
            this.rendererParams.map_mode = map_mode;
            this.rendererParams.record_options = {
                editable: activeActions.edit,
                deletable: activeActions.delete,
                read_only_mode: params.readOnlyMode || true,
            };
            this.controllerParams.mode =
                arch.attrs.editable && !params.readonly ? 'edit' : 'readonly';
            this.controllerParams.hasButtons = true;
            if (!_.isObject(attrs.options)) {
                attrs.options = attrs.options ? pyUtils.py_eval(attrs.options) : {};
            }
            var func_name = 'set_property_' + map_mode;
            this[func_name].call(this, attrs);
        },
        set_property_geometry: function (attrs) {
            var colors = this._setMarkersColor(attrs.colors);
            this.rendererParams.markerColor = attrs.color;
            this.rendererParams.markerColors = colors;
            this.rendererParams.fieldLat = attrs.lat;
            this.rendererParams.fieldLng = attrs.lng;
            this._setClusterParams(attrs);
        },
        _setMarkersColor: function (colors) {
            var pair = null;
            var color = null;
            var expr = null;
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
                })
                .value();
        },
        _setClusterParams: function (attrs) {
            var optionClusterConfig = {};
            var defaultMarkerClusterConfig = this._getDefaultClusterMarkerConfig();
            if (attrs.options) {
                var configMapper = this._getClusterMarkerConfigMapper();
                for (var key in attrs.options) {
                    var conf = configMapper[key];
                    if (conf !== undefined) {
                        optionClusterConfig[conf] = attrs.options[key];
                    }
                }
            }
            this.rendererParams.markerClusterConfig = _.defaults(
                optionClusterConfig,
                defaultMarkerClusterConfig
            );
        },
        _getClusterMarkerConfigMapper: function () {
            // more options can be found on this url https://googlemaps.github.io/v3-utility-library/interfaces/_google_markerclustererplus.markerclustereroptions.html
            // override this function and the `_getDefaultClusterMarkerConfig` if you want cover more 
            return {
                cluster_grid_size: 'gridSize',
                cluster_max_zoom_level: 'maxZoom',
                cluster_zoom_on_click: 'zoomOnClick',
                cluster_image_path: 'imagePath',
            };
        },
        _getDefaultClusterMarkerConfig: function () {
            return {
                gridSize: 40,
                maxZoom: 7,
                zoomOnClick: true,
                imagePath: '/web_google_maps/static/lib/markercluster/img/m',
            };
        },
    });

    return MapView;
});
