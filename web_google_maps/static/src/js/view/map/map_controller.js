odoo.define('web_google_maps.MapController', function(require) {
    'use strict';

    var KanbanController = require('web.KanbanController');
    var BasicController = require('web.BasicController');

    var MapController = BasicController.extend({
        init: function (parent, model, renderer, params) {
            this._super.apply(this, arguments);
            this.createGroupMarkerEnabled = this._isCreateGroupMarkerEnabled();
        },
        update: function () {
            this.createGroupMarkerEnabled = this._isCreateGroupMarkerEnabled();
            return this._super.apply(this, arguments);
        },
        _isCreateGroupMarkerEnabled: function () {
            var groupMarkerCreate = this.is_action_enabled('group_marker_create');
            if (!groupMarkerCreate) {
                // pre-return to avoid a lot of the following processing
                return false;
            }
            var state = this.model.get(this.handle, {raw: true});
            var groupByField = state.fields[state.groupedBy[0]];
            var groupedByM2o = groupByField && (groupByField.type === 'many2one');
            return groupedByM2o;
        },
    });

    return MapController;
});
