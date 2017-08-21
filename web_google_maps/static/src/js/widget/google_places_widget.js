odoo.define('web_google_maps.GooglePlacesFormAddress', function (require) {
    "use strict";

    var core = require('web.core');
    var form_widgets = require('web.form_widgets');
    var ajax = require('web.ajax');
    var MapViewPlacesAutocomplete = require('web.MapViewPlacesAutocomplete');
    var Model = require('web.Model');
    var _t = core._t;


    var FieldCharGooglePlaces = form_widgets.FieldChar.extend({
        template: 'web_google_maps.FieldGooglePlaces',
        display_name: _t('Google Places Form Address'),
        events: {
            'focus': 'geolocate',
            'change': 'store_dom_value'
        },
        init: function (field_manager, node) {
            this._super.apply(this, arguments);
            this.type_relations = ['one2many', 'many2one', 'many2many'];
            this.places_autocomplete = false;
            this.component_form = MapViewPlacesAutocomplete.GOOGLE_PLACES_COMPONENT_FORM;
            // `name` is not a part of place.address components, but it's a part of place
            // * place = values returns by places autocomplete or places autocomplete form address
            // In case if 'street_number' and 'route' in place.address_components is not exists, `name` will be the last attribute to check
            this.fillfields = {
                street: ['street_number', 'route', 'name'],
                street2: ['administrative_area_level_3', 'administrative_area_level_4', 'administrative_area_level_5'],
                city: ['locality', 'administrative_area_level_2'],
                zip: 'postal_code',
                state_id: 'administrative_area_level_1',
                country_id: 'country'
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
            this.places_autocomplete = new google.maps.places.Autocomplete(this.$input.get(0), {
                types: ['geocode']
            });
            // When the user selects an address from the dropdown, populate the address fields in the form.
            this.places_autocomplete.addListener('place_changed', function () {
                var place = this.getPlace();
                if (place.hasOwnProperty('address_components')) {
                    var google_address = MapViewPlacesAutocomplete.gmaps_populate_address(place, self.fillfields, self.fillfields_delimiter);
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
            return MapViewPlacesAutocomplete.odoo_prepare_values(model, field_name, value);
        },
        render_value: function () {
            this._super.apply(this, arguments);
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
        },
        destroy_content: function() {
            google.maps.event.clearInstanceListeners(this.places_autocomplete);
            this._super.apply(this, arguments);
        }
    });

    core.form_widget_registry.add('gplaces_address_form', FieldCharGooglePlaces);

    return FieldCharGooglePlaces;

});