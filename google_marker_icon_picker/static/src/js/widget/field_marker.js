odoo.define('google_marker_icon_picker.MarkerColor', function (require) {
    'use strict';

    const core = require('web.core');
    const AbstractField = require('web.AbstractField');
    const registry = require('web.field_registry');
    const qweb = core.qweb;

    const MarkerColorPicker = AbstractField.extend({
        tag_template: 'FieldMarkerColorPicker',
        className: 'o_field_char_marker_color',
        supportedFieldTypes: ['char'],
        events: _.extend({}, AbstractField.prototype.events, {
            'click .dropdown-toggle': '_onOpenMarkerPicker',
        }),

        _onOpenMarkerPicker: function (ev) {
            ev.preventDefault();
            this.$marker_picker = $(
                qweb.render('FieldMarkerColorPicker.marker_picker', {
                    widget: this,
                })
            );
            $(ev.currentTarget).after(this.$marker_picker);
            this.$marker_picker.dropdown();
            this.$marker_picker.one('click', 'a', this._onSelectMarker.bind(this));
        },

        _renderEdit: function () {
            this._renderMarker();
        },

        _renderReadonly: function () {
            this._renderMarker();
        },

        _renderMarker: function () {
            this.$el.html(qweb.render(this.tag_template, { color: this.value }));
        },

        _onSelectMarker: function (ev) {
            ev.preventDefault();
            const color = $(ev.currentTarget).attr('data-color');
            this.trigger_up('field_changed', {
                dataPointID: this.dataPointID,
                changes: {
                    [this.name]: color,
                },
            });
        },
    });

    registry.add('google_marker_picker', MarkerColorPicker);
});
