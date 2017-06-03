odoo.define('web_wizard_dialog_resize.Dialog', function (require) {
    'use strict';

    var Dialog = require('web.Dialog');
    var Model = require('web.DataModel');

    Dialog.include({
        init: function (parent, options) {
            this._super(parent, options);
            this.get_default_dialog_size();
            this.$modal.find('.maximize').on('click', _.bind(this.on_dialog_resize, this, 'maximize'));
            this.$modal.find('.minimize').on('click', _.bind(this.on_dialog_resize, this, 'minimize'));
        },
        get_default_dialog_size: function () {
            var self = this;
            new Model('ir.config_parameter').call('search_read', [
                [
                    ['key', '=', 'default_dialog_maximize']
                ],
                ['key', 'value']
            ]).then(function (config) {
                if (config.length) {
                    if (config[0].value == '1') {
                        self.on_dialog_resize('maximize');
                    }
                }
            });
        },
        on_dialog_resize: function (act_window) {
            this.$modal.toggleClass('fullscreen-modal');
            this.$modal.find('.' + act_window).hide();
            if (act_window == 'maximize') {
                this.$modal.find('.minimize').show();
            } else {
                this.$modal.find('.maximize').show();
            }
        }
    });

});