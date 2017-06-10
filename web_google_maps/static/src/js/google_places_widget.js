odoo.define('web_google_maps.GooglePlaces', function (require) {
    "use strict";

    var core = require('web.core');
    var form_widgets = require('web.form_widgets');
    var ajax = require('web.ajax');
    var Model = require('web.Model');
    var _t = core._t;


    var FieldCharGooglePlaces = form_widgets.FieldChar.extend({
        template: 'web_google_maps.FieldGooglePlaces',
        display_name: _t('Google Places'),
        events: {
            'focus': 'geolocate',
            'change': 'store_dom_value'
        },
        init: function (field_manager, node) {
            this._super.apply(this, arguments);
            this.type_relations = ['one2many', 'many2one', 'many2many'];
            this.places_autocomplete = false;
            this.component_form = {
                street_number: 'long_name',
                route: 'long_name',
                intersection: 'short_name',
                political: 'short_name',
                country: 'short_name',
                administrative_area_level_1: 'long_name',
                administrative_area_level_2: 'short_name',
                administrative_area_level_3: 'short_name',
                administrative_area_level_4: 'short_name',
                administrative_area_level_5: 'short_name',
                colloquial_area: 'short_name',
                locality: 'short_name',
                ward: 'short_name',
                sublocality_level_1: 'short_name',
                sublocality_level_2: 'short_name',
                sublocality_level_3: 'short_name',
                sublocality_level_5: 'short_name',
                neighborhood: 'short_name',
                premise: 'short_name',
                postal_code: 'short_name',
                natural_feature: 'short_name',
                airport: 'short_name',
                park: 'short_name',
                point_of_interest: 'long_name'
            };
            this.fillfields = {
                street2: ['street_number', 'route', 'administrative_area_level_3', 'administrative_area_level_4', 'administrative_area_level_5'],
                city: ['locality', 'administrative_area_level_2'],
                zip: 'postal_code',
                state_id: 'administrative_area_level_1',
                country_id: 'country',
            };
        },
        initialize_content: function () {
            var self = this;
            this._super();
            if (!this.get('effective_readonly')) {
                // update 'fillfields' and 'component_form' if exists
                if (this.options) {
                    if (this.options.hasOwnProperty('fillfields')) {
                        this.fillfields = this.options.fillfields;
                    }
                    if (this.options.hasOwnProperty('component_form')) {
                        _.extend(this.component_form, this.options.component_form)
                    }
                }
                this.target_fields = this.get_field_type();
            }
        },
        get_field_type: function () {
            var self = this;
            var fields = [];
            if (this.is_fields_valid()) {
                _.each(this.fillfields, function (val, name) {
                    if (_.contains(self.type_relations, self.field_manager.fields[name].field.type)) {
                        var field = {
                            name: name,
                            type: self.field_manager.fields[name].field.type,
                            relation: self.field_manager.fields[name].field.relation
                        };
                        fields.push(field);
                    } else {
                        var field = {
                            name: name,
                            type: self.field_manager.fields[name].field.type,
                            relation: false
                        };
                        fields.push(field);
                    }
                });
            }
            return fields;
        },
        set_partner_lat_lng: function (latitude, longitude) {
            var partner = ['partner_latitude', 'partner_longitude'];
            var res = {};
            if (_.intersection(_.keys(this.field_manager.fields), partner).length == 2) {
                res.partner_latitude = latitude;
                res.partner_longitude = longitude;
            }
            return res;
        },
        geolocate: function () {
            var self = this;
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    var geolocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    var circle = new google.maps.Circle({
                        center: geolocation,
                        radius: position.coords.accuracy
                    });

                    self.places_autocomplete.setBounds(circle.getBounds());
                });
            }
        },
        gmaps_initialize: function () {
            var self = this;
            this.places_autocomplete = new google.maps.places.Autocomplete(this.$input[0], {
                types: ['geocode']
            });
            // When the user selects an address from the dropdown, populate the address fields in the form.
            this.places_autocomplete.addListener('place_changed', function () {
                var place = this.getPlace();
                if (place.hasOwnProperty('address_components')) {
                    var google_address = self.populate_address(place);
                    var requests = [];

                    _.each(self.target_fields, function (field) {
                        requests.push(self.prepare_value(field.relation, field.name, google_address[field.name]));
                    });

                    var partner_geometry = self.set_partner_lat_lng(place.geometry.location.lat(), place.geometry.location.lng());
                    _.each(partner_geometry, function (val, field) {
                        requests.push(self.prepare_value(false, field, val));
                    });

                    $.when.apply($, requests).done(function () {
                        _.each(arguments, function (data, idx) {
                            _.each(data, function (val, key) {
                                self.field_manager.fields[key].set_value(val);
                            });
                        });
                    });
                    self.$input.val(google_address[self.name]);
                }
            });
        },
        prepare_value: function (model, field_name, value) {
            var def = $.Deferred();
            var res = {};
            if (model) {
                new Model(model).call('search', [['|', ['name', '=', value], ['code', '=', value]]]).done(function (record) {
                    res[field_name] = record.length > 0 ? record[0] : false;
                    def.resolve(res);
                });
            } else {
                res[field_name] = value;
                def.resolve(res);
            }
            return def;
        },
        populate_address: function (place) {
            var self = this;
            var fields_to_fill = {}
            var result = {};

            // initialize object key and value
            _.each(self.fillfields, function (value, key) {
                fields_to_fill[key] = [];
            });

            _.each(self.fillfields, function (options, key) {
                _.each(place.address_components, function (data) {
                    if (options instanceof Array && _.contains(options, data.types[0])) {
                        fields_to_fill[key].push(data[self.component_form[data.types[0]]]);
                    } else if (options == data.types[0]) {
                        fields_to_fill[key].push(data[self.component_form[data.types[0]]]);
                    }
                });
            });

            _.each(fields_to_fill, function (value, key) {
                result[key] = key == 'city' ? (value.length > 0 ? value[0] : false) : value.join(', ');
            });

            result[this.name] = place.name;

            return result;
        },
        render_value: function () {
            this._super();
            if (this.$input && this.is_fields_valid()) {
                this.gmaps_initialize();
            }
        },
        is_fields_valid: function () {
            var self = this;
            var unknown_fields = _.filter(_.keys(self.fillfields), function (field) {
                return !self.field_manager.fields.hasOwnProperty(field);
            });
            if (unknown_fields.length === 0) {
                return true;
            } else {
                self.do_warn(_t('The following fields are invalid:'), _t('<ul><li>' + unknown_fields.join('</li><li>') + '</li></ul>'));
                return false;
            }
        }
    });

    core.form_widget_registry.add('google_places', FieldCharGooglePlaces);

    return FieldCharGooglePlaces;

});
