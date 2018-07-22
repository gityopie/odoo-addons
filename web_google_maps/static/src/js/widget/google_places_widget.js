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
        events: _.extend({}, form_widgets.FieldChar.prototype.events, {'focus': 'geolocate'}),
        init: function (field_manager, node) {
            this._super.apply(this, arguments);
            this.type_relations = ['one2many', 'many2one', 'many2many'];
            this.component_form = MapViewPlacesAutocomplete.GOOGLE_PLACES_COMPONENT_FORM;
            this.fillfields = {
                street: ['street_number', 'route'],
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
            this.lng = false;
            this.lat = false;
        },
        initialize_content: function () {
            var self = this;
            this._super();
            if (!this.get('effective_readonly')) {
                // update 'fillfields' and 'component_form' if exists
                if (this.options) {
                    if (this.options.hasOwnProperty('fillfields')) {
                        this.fillfields = _.defaults({}, this.options.fillfields, this.fillfields);
                    }
                    if (this.options.hasOwnProperty('component_form')) {
                        this.component_form = _.defaults({}, this.options.component_form, this.component_form);
                    }
                    if (this.options.hasOwnProperty('delimiter')) {
                        this.fillfields_delimiter = _.defaults({}, this.options.delimiter, this.fillfields_delimiter);
                    }
                    if (this.options.hasOwnProperty('lat')) {
                        this.lat = this.options.lat;
                    }
                    if (this.options.hasOwnProperty('lng')) {
                        this.lng = this.options.lng;
                    }
                }
                this.target_fields = this.get_field_type();
                if (this.is_fields_valid()) {
                    this.initAutocomplete();
                }
            }
        },
        get_field_type: function () {
            var self = this,
                fields = [];
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
            var partner = [this.lat, this.lng],
                res = {};
            if (_.intersection(_.keys(this.field_manager.fields), partner).length == 2) {
                res[this.lat] = latitude;
                res[this.lng] = longitude;
            }
            return res;
        },
        geolocate: function () {
            var self = this,
                geolocation, circle;
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    geolocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    circle = new google.maps.Circle({
                        center: geolocation,
                        radius: position.coords.accuracy
                    });

                    self.places_autocomplete.setBounds(circle.getBounds());
                });
            }
        },
        initAutocomplete: function () {
            var self = this,
                place, google_address, requests = [],
                partner_geometry;
            this.places_autocomplete = new google.maps.places.Autocomplete(this.$input.get(0), {
                types: ['geocode']
            });
            // When the user selects an address from the dropdown, populate the address fields in the form.
            this.places_autocomplete.addListener('place_changed', function () {
                place = this.getPlace();
                if (place.hasOwnProperty('address_components')) {
                    google_address = MapViewPlacesAutocomplete.gmaps_populate_address(place, self.fillfields, self.fillfields_delimiter);

                    _.each(self.target_fields, function (field) {
                        requests.push(self.prepare_value(field.relation, field.name, google_address[field.name]));
                    });

                    partner_geometry = self.set_partner_lat_lng(place.geometry.location.lat(), place.geometry.location.lng());
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
        destroy_content: function () {
            if (this.places_autocomplete) {
                google.maps.event.clearInstanceListeners(this.places_autocomplete);
            }
            this._super.apply(this, arguments);
        },
        /**
         * Overwritten method
         * Prevent parent to bind 'focus' event on field widget
         * it triggers google to bind the autocomplete while the form has been saved
         */
        focus: function() {
            return false;
        }
    });

    core.form_widget_registry.add('gplaces_address_form', FieldCharGooglePlaces);

    return FieldCharGooglePlaces;

});