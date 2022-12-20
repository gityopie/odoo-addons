odoo.define('web_google_maps.relational_fields', function (require) {
    'use strict';

    const core = require('web.core');
    const relational_fields = require('web.relational_fields');
    const pyUtils = require('web.py_utils');
    const GoogleMapRenderer = require('web_google_maps.GoogleMapRenderer').GoogleMapRenderer;
    const Utils = require('web_google_maps.Utils');

    const qweb = core.qweb;

    const FieldX2ManyGoogleMap = {
        init: function () {
            this._super.apply(this, arguments);
            if (this.view && this.view.arch.tag === 'google_map') {
                this.mapMode = this.view.arch.mode ? this.view.arch.mode : 'geometry';
            }
        },
        _render: function () {
            if (!this.view) {
                return this._super();
            }
            const arch = this.view.arch;
            if (
                arch.tag == 'google_map' &&
                !this.$el[0].className.includes('o_field_x2many_google_map')
            ) {
                const func_name = '_render_map_' + this.mapMode;
                this.renderer = this[func_name].call(this, arch);
                this.$el.addClass('o_field_x2many o_field_x2many_google_map');
                return this.renderer.appendTo(this.$el);
            }
            return this._super();
        },
        _getRenderer: function () {
            if (this.view.arch.tag === 'google_map') {
                return GoogleMapRenderer;
            }
            return this._super();
        },
        _render_map_geometry: function (arch) {
            // TODO: this must be taken from record/model permission
            const record_options = {
                editable: true,
                deletable: true,
                read_only_mode: this.isReadonly,
            };
            let colors;
            if (arch.attrs.colors) {
                colors = Utils.parseMarkersColor(arch.attrs.colors);
            }
            const Renderer = this._getRenderer();
            return new Renderer(this, this.value, {
                arch: arch,
                record_options: record_options,
                viewType: 'google_map',
                fieldLat: arch.attrs.lat,
                fieldLng: arch.attrs.lng,
                markerColor: arch.attrs.color,
                markerColors: colors,
                disableClusterMarker:
                    arch.attrs.disable_cluster_marker !== undefined
                        ? !!pyUtils.py_eval(arch.attrs.disable_cluster_marker)
                        : false,
                gestureHandling: arch.attrs.gesture_handling || 'cooperative',
                mapMode: this.mapMode,
                googleMapStyle: arch.attrs.map_style || 'default',
                sidebarTitle: arch.attrs.sidebar_title,
                sidebarSubtitle: arch.attrs.sidebar_subtitle,
            });
        },
        /**
         * Override
         */
        _renderButtons: function () {
            this._super.apply(this, arguments);
            if (this.view.arch.tag === 'google_map') {
                const func_name = '_render_map_button_' + this.mapMode;
                this[func_name].call(this);
            }
        },
        _render_map_button_geometry: function () {
            const options = { create_text: this.nodeOptions.create_text, widget: this };
            this.$buttons = $(qweb.render('GoogleMapView.InlineFormButtons', options));
            this.$buttons.on('click', 'button.o-map-button-new', this._onAddRecord.bind(this));
            this.$buttons.on('click', 'button.o-map-button-center-map', this._onMapCenter.bind(this));
        },
        _onMapCenter: function (event) {
            event.preventDefault();
            event.stopPropagation();
            const func_name = '_map_center_' + this.renderer.mapMode;
            this.renderer[func_name].call(this.renderer);
        },
    };

    relational_fields.FieldOne2Many.include(FieldX2ManyGoogleMap);

    relational_fields.FieldMany2Many.include(FieldX2ManyGoogleMap);
});
