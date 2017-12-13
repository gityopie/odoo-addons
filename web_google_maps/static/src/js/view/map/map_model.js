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
        /**
         * @override
         * @param {Widget} parent
         */
        init: function () {
            this._super.apply(this, arguments);
        },
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

            if (!this.preload_def) {
                this.preload_def = $.Deferred();
                $.when(
                    this._rpc({model: this.modelName, method: 'check_access_rights', args: ["write", false]}),
                    this._rpc({model: this.modelName, method: 'check_access_rights', args: ["create", false]}))
                .then(function (write, create) {
                    self.write_right = write;
                    self.create_right = create;
                    self.preload_def.resolve();
                });                
            }
            this.data = {
                domain: params.domain,
                context: params.context,
                filter: params.filter
            }
            return this.preload_def.then(this._loadMap.bind(this));
        },
        reload: function (_handle, params) {
            if (params.domain) {
                this.data.domain = params.domain;
            }
            return this._loadMap();
        },
        _loadMap: function () {
            var self = this;
            var defs = _.map(this.data.filters, this._loadFilter.bind(this));
            return $.when.apply($, defs).then(function() {
                return self._rpc({
                    model: self.modelName,
                    method: 'search_read',
                    context: self.data.context,
                    domain: self.data.domain,
                    fields: self.fieldNames
                }).then(function (events) {
                    self._parseServerData(events);
                    self.data.data = events;
                    return $.when(
                        self._loadRecordsToFilters(self.data, self.data.data)
                    );
                });
            });
        },
        /**
         * parse the server values to javascript framwork
         *
         * @param {Object} data the server data to parse
         */
        _parseServerData: function (data) {
            var self = this;
            _.each(data, function(event) {
                _.each(self.fieldNames, function (fieldName) {
                    event[fieldName] = self._parseServerValue(self.fields[fieldName], event[fieldName]);
                });
            });
        },
        _loadFilter: function (filter) {
            if (!filter.write_model) {
                return;
            }
            var fields = this.fields[filter.fieldName];
            return this._rpc({
                model: filter.write_model,
                method: 'search_read',
                domain: [['user_id', '=', session.uid]],
                fields: [fields.write_field],
            }).then(function(res) {
                var records = _.map(res, function (record) {
                    var _value = record[filter.write_field];
                    var value = _.isArray(_value) ? _value[0] : _value;
                    var f = _.find(filter.filters, function (f) {return f.value === value;});
                    var formater = fieldUtils.format[_.contains(['many2many', 'one2many'], field.type) ? 'many2one' : field.type]; 
                    return {
                        'id': record.id,
                        'value': value,
                        'label': formater(_value, field),
                        'active': !f || f.active,
                    };
                });

                records.sort(function (f1,f2) {
                    return _.string.naturalCmp(f2.label, f1.label);
                
                });

                filter.filters = records;
            });
        },
        /**
         * @param {any} element
         * @param {any} events
         * @returns {Deferred}
         */
        _loadRecordsToFilters: function (element, events) {
            var self = this;
            var new_filters = {};
            var to_read = {};

            _.each(this.data.filters, function (filter, fieldName) {
                var field = self.fields[fieldName];

                new_filters[fieldName] = filter;
                if (filter.write_model) {
                    if (field.relation === self.model_color) {
                        _.each(filter.filters, function (f) {
                            f.color_index = f.value;
                        });
                    }
                    return;
                }

                _.each(filter.filters, function (filter) {
                    filter.display = !filter.active;
                });

                var fs = [];
                _.each(events, function (event) {
                    var data =  event.record[fieldName];
                    if (!_.contains(['many2many', 'one2many'], field.type)) {
                        data = [data];
                    } else {
                        to_read[field.relation] = (to_read[field.relation] || []).concat(data);
                    }
                    _.each(data, function (_value) {
                        var value = _.isArray(_value) ? _value[0] : _value;
                        fs.push({
                            'color_index': self.model_color === (field.relation || element.model) ? value : false,
                            'value': value,
                            'label': fieldUtils.format[field.type](_value, field),
                            'avatar_model': field.relation || element.model,
                        });
                    });
                });
                _.each(fs, function (f) {
                    var f1 = _.findWhere(filter.filters, f);
                    if (f1) {
                        f1.display = true;
                    } else {
                        f.display = f.active = true;
                        filter.filters.push(f);
                    }
                });
            });

            var defs = [];
            _.each(to_read, function (ids, model) {
                defs.push(self._rpc({
                        model: model,
                        method: 'name_get',
                        args: [_.uniq(ids)],
                    })
                    .then(function (res) {
                        to_read[model] = _.object(res);
                    }));
            });
            return $.when.apply($, defs).then(function () {
                _.each(self.data.filters, function (filter) {
                    if (filter.write_model) {
                        return;
                    }
                    if (filter.filters.length && (filter.filters[0].avatar_model in to_read)) {
                        _.each(filter.filters, function (f) {
                            f.label = to_read[f.avatar_model][f.value];
                        });
                    }
                });
            });
        }
    });

    return MapModel;

});
