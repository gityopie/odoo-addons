odoo.define('web_google_maps.MapController', function(require) {
    'use strict';

    var AbstractController = require('web.AbstractController');
    var core = require('web.core');
    var Dialog = require('web.Dialog');
    var FieldManagerMixin = require('web.FieldManagerMixin');
    var Pager = require('web.Pager');
    
    var _t = core._t;


    var MapController = AbstractController.extend(FieldManagerMixin, {
        custom_events: _.extend({}, AbstractController.prototype.custom_events, FieldManagerMixin.custom_events, {
            reload: '_onReload',
            translate: '_onTranslate',
        }),
        init: function (parent, model, renderer, params) {
            this._super.apply(this, arguments);
            this.displayName = params.displayName;
            this.formViewId = params.formViewId;
            this.readonlyFormViewId = params.readonlyFormViewId;
            this.mapping = params.mapping;
            this.context = params.context;
        },
        /**
         * @param {Object} record
         * @param {integer} record.id
         * @returns {Deferred}
         */
        _updateRecord: function (record) {
            return this.model.updateRecord(record).then(this.reload.bind(this));
        },
        /**
         * @param {OdooEvent} event
         */
        _onChangeFilter: function (event) {
            if (this.model.changeFilter(event.data) && !event.data.no_reload) {
                this.reload();
            }
        },
    });

    return MapController;
});
