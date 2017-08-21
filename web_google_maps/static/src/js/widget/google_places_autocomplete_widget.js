odoo.define('web_google_maps.GooglePlacesAutocomplete', function (require) {
    "use strict";

    var core = require('web.core');
    var form_widgets = require('web.form_widgets');
    var ajax = require('web.ajax');
    var MapViewPlacesAutocomplete = require('web.MapViewPlacesAutocomplete');
    var _t = core._t;


    var FieldCharGooglePlacesAutocomplete = form_widgets.FieldChar.extend({
        template: 'web_google_maps.FieldGooglePlacesAutocomplete',
        display_name: _t('Google Places'),
        events: {
            'change': 'store_dom_value'
        },
        init: function (field_manager, node) {
            this._super.apply(this, arguments);
            this.type_relations = ['one2many', 'many2one', 'many2many'];
            this.places_autocomplete = false;
            this.component_form = MapViewPlacesAutocomplete.GOOGLE_PLACES_COMPONENT_FORM;
            this.fillfields = {
                general: {
                    name: 'name',
                    website: 'website',
                    phone: ['international_phone_number', 'formatted_phone_number']
                },
                geolocation: {
                    partner_latitude: 'latitude',
                    partner_longitude: 'longitude'
                },
                address: {
                    street: ['street_number', 'route', 'name'],
                    street2: ['administrative_area_level_3', 'administrative_area_level_4', 'administrative_area_level_5'],
                    city: ['locality', 'administrative_area_level_2'],
                    zip: 'postal_code',
                    state_id: 'administrative_area_level_1',
                    country_id: 'country'
                }
            };
            this.fillfields_delimiter = {
                street: " ",
                street2: ", ",
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
                        _.extend(this.component_form, this.options.component_form);
                    }
                    if (this.options.hasOwnProperty('delimiter')) {
                        this.fillfields_delimiter = this.options.delimiter;
                    }
                }
                this.target_fields = this.get_field_type();
            }
        },
        get_field_type: function () {
            var self = this;
            var fields = [];
            if (this.is_fields_valid()) {
                for (var option in this.fillfields) {
                    _.each(this.fillfields[option], function (j, name) {
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
        gmaps_initialize: function () {
            var self = this;
            this.places_autocomplete = new google.maps.places.Autocomplete(this.$input.get(0));
            // When the user selects an address from the dropdown, populate the address fields in the form.
            this.places_autocomplete.addListener('place_changed', function () {
                var place = this.getPlace();
                var values = {};
                var requests = [];
                if (place.hasOwnProperty('address_components')) {
                    // Get address
                    var google_address = MapViewPlacesAutocomplete.gmaps_populate_address(place, self.fillfields.address, self.fillfields_delimiter);
                    _.extend(values, google_address);
                    // Get place (name, website, phone)
                    var google_place = MapViewPlacesAutocomplete.gmaps_populate_places(place, self.fillfields.general);
                    _.extend(values, google_place);
                    // Get place geolocation
                    var google_geolocation = MapViewPlacesAutocomplete.gmaps_get_geolocation(place, self.fillfields.geolocation);
                    _.extend(values, google_geolocation);

                    _.each(self.target_fields, function (field) {
                        requests.push(self.prepare_value(field.relation, field.name, values[field.name]));
                    });

                    $.when.apply($, requests).done(function () {
                        _.each(arguments, function (data, idx) {
                            _.each(data, function (val, key) {
                                self.field_manager.fields[key].set_value(val);
                            });
                        });
                    });
                    self.$input.val(place.name);
                }
            });
        },
        prepare_value: function (model, field_name, value) {
            return MapViewPlacesAutocomplete.odoo_prepare_values(model, field_name, value);
        },
        render_value: function () {
            this._super.apply(this, arguments);
            if (this.$input) {
                this.gmaps_initialize();
            }
        },
        is_fields_valid: function () {
            var self = this;
            var unknown_vals = [];
            for (var option in this.fillfields) {
                var unknown_fields = _.filter(_.keys(this.fillfields[option]), function (field) {
                    return !self.field_manager.fields.hasOwnProperty(field);
                });
                if (unknown_fields.length > 0) {
                    self.do_warn(_t('The following fields are invalid:'), _t('<ul><li>' + unknown_fields.join('</li><li>') + '</li></ul>'));
                    return false;
                }
            }
            return true;
        },
        destroy_content: function () {
            google.maps.event.clearInstanceListeners(this.places_autocomplete);
            this._super.apply(this, arguments);
        }
    });

    core.form_widget_registry.add('gplaces_autocomplete', FieldCharGooglePlacesAutocomplete);

    return FieldCharGooglePlacesAutocomplete;

});