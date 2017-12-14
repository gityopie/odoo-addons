odoo.define('web_google_maps.MapModel', function(require) {
    'use strict';

    var AbstractModel = require('web.AbstractModel');
    var Context = require('web.Context');
    var core = require('web.core');
    var fieldUtils = require('web.field_utils');
    var session = require('web.session');
    var time = require('web.time');
    
    var _t = core._t;
    


    var MapModel = AbstractModel.extend({
        get: function () {
            return _.extend({}, this.data, {
                fields: this.fields
            });
        },
        load: function (params) {
            var self = this;
            this.fields = params.fields;
            this.fieldNames = params.fieldNames;
            this.fieldsInfo = params.fieldsInfo;
            this.modelName = params.modelName;
            this.mode = params.mode;
            this.data = {
                domain: params.domain,
                context: params.context,
                filter: params.filter
            }
            return this._loadMap();
        },
        reload: function (_handle, params) {
            if (params.domain) {
                this.data.domain = params.domain;
            }
            return this._loadMap();
        },
        _loadMap: function () {
            var self = this;
            return self._rpc({
                model: self.modelName,
                method: 'search_read',
                context: self.data.context,
                domain: self.data.domain,
                fields: self.fieldNames
            }).then(self._parseServerData.bind(this));
        },
        /**
         * parse the server values to javascript framwork
         *
         * @param {Object} data the server data to parse
         */
        _parseServerData: function (data) {
            var self = this;
            this.data.data = data;
            _.each(data, function(event) {
                _.each(self.fieldNames, function (fieldName) {
                    event[fieldName] = self._parseServerValue(self.fields[fieldName], event[fieldName]);
                });
            });
        }
    });

    return MapModel;

});
