odoo.define('web_google_maps.MapFormController', function (require) {
    'use strict';

    var core = require('web.core');
    var MapController = require('web.FormController');
    var qweb = core.qweb;
    var _t = core._t;

    MapController.include({
        init: function (parent, model, renderer, params) {
            this._super.apply(this, arguments);
            this.geo_field = Object.prototype.hasOwnProperty.call(params, 'geo_field')
                ? params.geo_field
                : false;
        },
        renderButtons: function ($node) {
            this._super.apply(this, arguments);
            var $footer = this.footerToButtons ? this.$('footer') : null;
            var mustRenderFooterButtons = $footer && $footer.length;
            if (!this.defaultButtons && !mustRenderFooterButtons) {
                return;
            }
            if (this.$buttons && this.geo_field) {
                this.$marker_buttons = $(
                    qweb.render('FormView.marker_edit_button', {
                        widget: this,
                    })
                );
                this.$marker_buttons.on('click', this._onButtonEditMarker.bind(this));
                if (this.$buttons.find('.o_form_buttons_view').length > 0) {
                    this.$marker_buttons.appendTo(this.$buttons.find('.o_form_buttons_view'));
                }
            }
        },
        _updateButtons: function () {
            this._super.apply(this, arguments);
            if (this.$marker_buttons && this.geo_field) {
                this.$marker_buttons.toggleClass('o_hidden', this.model.isNew(this.handle));
            }
        },
        _onButtonEditMarker: function () {
            var record = this.model.get(this.handle);
            this.do_action({
                name: _t('Edit Geolocation'),
                res_model: this.modelName,
                type: 'ir.actions.act_window',
                view_type: 'google_map',
                view_mode: 'google_map',
                domain: [['id', '=', record.res_id]],
                views: [[false, 'google_map']],
                target: 'current',
                context: { edit_geo_field: true },
            });
        },
    });
});