odoo.define('web_google_maps.MapRecord', function (require) {
    'use strict';

    var core = require('web.core');
    var Domain = require('web.Domain');
    var field_utils = require('web.field_utils');
    var utils = require('web.utils');
    var Widget = require('web.Widget');
    var widgetRegistry = require('web.widget_registry');

    var _t = core._t;
    var QWeb = core.qweb;

    /**
     * MapRecord is adopted from KanbanRecord
     * instead of inherit the class, I created a new one and take only
     * what is necessary for marker info window
     *
     * The idea is to be able to generate a qweb template for marker-info-window like kanban template
     *
     */
    var MapRecord = Widget.extend({
        /**
         * @override
         */
        init: function (parent, state, options) {
            this._super(parent);

            this.fields = state.fields;
            this.fieldsInfo = state.fieldsInfo.map;
            this.modelName = state.model;

            this.options = options;
            this.editable = options.editable;
            this.deletable = options.deletable;
            this.draggable = options.draggable;
            this.read_only_mode = options.read_only_mode;
            this.qweb = options.qweb;
            this.subWidgets = {};

            this._setState(state);
        },
        /**
         * @override
         */
        start: function () {
            return this._super.apply(this, arguments).then(this._render.bind(this));
        },
        update: function (state) {
            // detach the widgets because the record will empty its $el, which will
            // remove all event handlers on its descendants, and we want to keep
            // those handlers alive as we will re-use these widgets
            _.invoke(_.pluck(this.subWidgets, '$el'), 'detach');
            this._setState(state);
            this._render();
        },
        _processFields: function () {
            var self = this;
            this.$("field").each(function () {
                var $field = $(this);
                var field_name = $field.attr("name");
                var field_widget = $field.attr("widget");

                // a widget is specified for that field or a field is a many2many ;
                // in this latest case, we want to display the widget many2manytags
                // even if it is not specified in the view.
                if (field_widget || self.fields[field_name].type === 'many2many') {
                    var widget = self.subWidgets[field_name];
                    if (!widget) {
                        // the widget doesn't exist yet, so instanciate it
                        var Widget = self.fieldsInfo[field_name].Widget;
                        if (Widget) {
                            widget = self._processWidget($field, field_name, Widget);
                            self.subWidgets[field_name] = widget;
                        } else if (core.debug) {
                            // the widget is not implemented
                            debugger;
                            $field.replaceWith($('<span>', {
                                text: _.str.sprintf(_t('[No widget %s]'), field_widget),
                            }));
                        }
                    } else {
                        // a widget already exists for that field, so reset it with the new state
                        widget.reset(self.state);
                        $field.replaceWith(widget.$el);
                    }
                } else {
                    self._processField($field, field_name);
                }
            });
        },
        _processField: function ($field, field_name) {
            // no widget specified for that field, so simply use a formatter
            // note: we could have used the widget corresponding to the field's type, but
            // it is much more efficient to use a formatter
            var field = this.fields[field_name];
            var value = this.recordData[field_name];
            var options = {
                data: this.recordData
            };
            var formatted_value = field_utils.format[field.type](value, field, options);
            var $result = $('<span>', {
                text: formatted_value,
            });
            $field.replaceWith($result);
            this._setFieldDisplay($result, field_name);
            return $result;
        },
        _setFieldDisplay: function ($el, fieldName) {
            // attribute display
            if (this.fieldsInfo[fieldName].display === 'right') {
                $el.addClass('pull-right');
            } else if (this.fieldsInfo[fieldName].display === 'full') {
                $el.addClass('o_text_block');
            }

            // attribute bold
            if (this.fieldsInfo[fieldName].bold) {
                $el.addClass('o_text_bold');
            }
        },
        _processWidget: function ($field, field_name, Widget) {
            // some field's attrs might be record dependent (they start with
            // 't-att-') and should thus be evaluated, which is done by qweb
            // we here replace those attrs in the dict of attrs of the state
            // by their evaluted value, to make it transparent from the
            // field's widgets point of view
            // that dict being shared between records, we don't modify it
            // in place
            var attrs = Object.create(null);
            _.each(this.fieldsInfo[field_name], function (value, key) {
                if (_.str.startsWith(key, 't-att-')) {
                    key = key.slice(6);
                    value = $field.attr(key);
                }
                attrs[key] = value;
            });
            var options = _.extend({}, this.options, {
                attrs: attrs
            });
            var widget = new Widget(this, field_name, this.state, options);
            widget.replace($field);
            this._setFieldDisplay(widget.$el, field_name);
            return widget;
        },
        _processWidgets: function () {
            var self = this;
            this.$("widget").each(function () {
                var $field = $(this);
                var Widget = widgetRegistry.get($field.attr('name'));
                var widget = new Widget(self, self.state);

                var def = widget.__widgetRenderAndInsert(function () {});
                if (def.state() === 'pending') {
                    self.defs.push(def);
                }
                widget.$el.addClass('o_widget');
                $field.replaceWith(widget.$el);
            });
        },
        _render: function () {
            this.replaceElement(this.qweb.render('map-marker-iw', this.qweb_context));
            this.$el.addClass('o_map_record');
            this.$el.data('record', this);
            if (this.$el.hasClass('o_map_global_click') || this.$el.hasClass('o_map_marker_click_edit')) {
                this.$el.on('click', this._onGlobalClick.bind(this));
            }
            this._processFields();
            this._processWidgets();
        },
        _getImageURL: function (model, field, id, cache, options) {
            options = options || {};
            var url;
            if (this.record[field] && this.record[field].value && !utils.is_bin_size(this.record[field].value)) {
                url = 'data:image/png;base64,' + this.record[field].value;
            } else if (this.record[field] && !this.record[field].value) {
                url = "/web/static/src/img/placeholder.png";
            } else {
                if (_.isArray(id)) {
                    id = id[0];
                }
                if (!id) {
                    id = undefined;
                }
                if (options.preview_image) {
                    field = options.preview_image;
                }
                var unique = this.record.__last_update && this.record.__last_update.value.replace(/[^0-9]/g, '');
                var session = this.getSession();
                url = session.url('/web/image', {
                    model: model,
                    field: field,
                    id: id,
                    unique: unique
                });
                if (cache !== undefined) {
                    // Set the cache duration in seconds.
                    url += '&cache=' + parseInt(cache, 10);
                }
            }
            return url;
        },
        /**
         * Triggers up an event to open the record
         *
         * @private
         */
        _onGlobalClick: function () {
            this.trigger_up('open_record', {
                id: this.db_id,
                mode: 'readonly'
            });
        },
        _computeDomain: function (d) {
            return new Domain(d).compute(this.state.evalContext);
        },
        _transformRecord: function (recordData) {
            var self = this,
                new_record = {},
                value, r, formatter;
            _.each(this.state.getFieldNames(), function (name) {
                value = recordData[name];
                r = _.clone(self.fields[name] || {});

                if ((r.type === 'date' || r.type === 'datetime') && value) {
                    r.raw_value = value.toDate();
                } else if (r.type === 'one2many' || r.type === 'many2many') {
                    r.raw_value = value.count ? value.res_ids : [];
                } else if (r.type === 'many2one') {
                    r.raw_value = value && value.res_id || false;
                } else {
                    r.raw_value = value;
                }

                if (r.type) {
                    formatter = field_utils.format[r.type];
                    r.value = formatter(value, self.fields[name], recordData, self.state);
                } else {
                    r.value = value;
                }

                new_record[name] = r;
            });
            return new_record;
        },
        /**
         * Overrided
         */
        _setState: function (recordState) {
            this.state = recordState;
            this.id = recordState.res_id;
            this.db_id = recordState.id;
            this.recordData = recordState.data;
            this.record = this._transformRecord(recordState.data);
            this.qweb_context = {
                map_image: this._getImageURL.bind(this),
                map_compute_domain: this._computeDomain.bind(this),
                read_only_mode: this.read_only_mode,
                record: this.record,
                user_context: this.getSession().user_context,
                widget: this,
            };
        },
    });

    return MapRecord;

});