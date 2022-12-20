odoo.define('web_google_maps.GoogleMapView', function (require) {
    'use strict';

    const BasicView = require('web.BasicView');
    const core = require('web.core');
    const pyUtils = require('web.py_utils');

    const GoogleMapModel = require('web_google_maps.GoogleMapModel');
    const GoogleMapRenderer = require('web_google_maps.GoogleMapRenderer').GoogleMapRenderer;
    const GoogleMapController = require('web_google_maps.GoogleMapController');
    const Utils = require('web_google_maps.Utils');

    const _lt = core._lt;

    const GoogleMapView = BasicView.extend({
        accesskey: 'm',
        display_name: _lt('Google Map'),
        icon: 'fa-map-o',
        config: _.extend({}, BasicView.prototype.config, {
            Model: GoogleMapModel,
            Renderer: GoogleMapRenderer,
            Controller: GoogleMapController,
        }),
        viewType: 'google_map',
        mobile_friendly: true,
        _map_mode: function () {
            return ['geometry'];
        },
        init: function (viewInfo, params) {
            this._super.apply(this, arguments);

            const arch = this.arch;
            const attrs = arch.attrs;
            const activeActions = this.controllerParams.activeActions;

            this.loadParams.limit = this.loadParams.limit || 80;
            this.loadParams.type = 'list';

            const modes = this._map_mode();
            const defaultMode = 'geometry';
            const map_mode = attrs.mode ? (modes.indexOf(attrs.mode) > -1 ? attrs.mode : defaultMode) : defaultMode;
            this.rendererParams.arch = arch;
            this.rendererParams.map_mode = map_mode;
            this.rendererParams.record_options = {
                editable: activeActions.edit,
                deletable: activeActions.delete,
                read_only_mode: params.readOnlyMode || true,
            };
            this.controllerParams.mode = arch.attrs.editable && !params.readonly ? 'edit' : 'readonly';
            this.controllerParams.hasButtons = true;
            if (attrs.options && !_.isObject(attrs.options)) {
                attrs.options = attrs.options ? pyUtils.py_eval(attrs.options) : {};
            }
            const func_name = 'set_property_' + map_mode;
            this[func_name].call(this, attrs);
        },
        set_property_geometry: function (attrs) {
            const colors = Utils.parseMarkersColor(attrs.colors);
            this.rendererParams.markerColor = attrs.color;
            this.rendererParams.markerColors = colors;
            this.rendererParams.fieldLat = attrs.lat;
            this.rendererParams.fieldLng = attrs.lng;
            this.rendererParams.gestureHandling = attrs.gesture_handling;
            this.rendererParams.googleMapStyle = attrs.map_style || false;
            this.rendererParams.disableClusterMarker =
                attrs.disable_cluster_marker !== undefined ? !!pyUtils.py_eval(attrs.disable_cluster_marker) : false;
            this.rendererParams.sidebarTitle = attrs.sidebar_title || false;
            this.rendererParams.sidebarSubtitle = attrs.sidebar_subtitle || false;
            this.rendererParams.disableNavigation = attrs.disable_navigation !== undefined ? !!pyUtils.py_eval(attrs.disable_navigation) : false;
        },
    });

    return GoogleMapView;
});
