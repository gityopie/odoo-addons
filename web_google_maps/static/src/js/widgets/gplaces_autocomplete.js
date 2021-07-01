odoo.define('web_google_maps.GplaceAutocompleteFields', function (require) {
    'use strict';

    var BasicFields = require('web.basic_fields');
    var core = require('web.core');
    var Utils = require('web_google_maps.Utils');
    var _t = core._t;

    var GplaceAutocomplete = BasicFields.InputField.extend({
        tagName: 'span',
        supportedFieldTypes: ['char'],
        /**
         * @override
         */
        init: function () {
            this._super.apply(this, arguments);
            // variable that will hold google address form/places autocomplete instance
            this.places_autocomplete = false;
            // Google places component form
            this.component_form = Utils.GOOGLE_PLACES_COMPONENT_FORM;
            // Odoo address fields
            this.address_form = Utils.ADDRESS_FORM;
            // Delimiter
            this.fillfields_delimiter = {
                street: ' ',
                street2: ', ',
            };
            // Fields to be filled when place/address is selected
            this.fillfields = {};
            // Longitude, field's name that hold longitude
            this.lng = false;
            // Latitude, field's name that hold latitude
            this.lat = false;
            // Google address form/places instance attribute to be assigned to the field
            this.display_name = 'name';
            // Utilize the default `fillfields` and then combined it with the fillfields options given if any
            // or overwrite the default values and used the `fillfields` provided in the options instead.
            // This option will be applied only on `fillfields` and `address_form`
            this.force_override = false;
            this.autocomplete_settings = null;
        },
        /**
         * @override
         */
        willStart: function () {
            var self = this;
            this.setDefault();
            var getSettings = this._rpc({
                route: '/web/google_autocomplete_conf',
            }).then(function (res) {
                self.autocomplete_settings = res;
            });
            return $.when(this._super.apply(this, arguments), getSettings);
        },
        /**
         * @override
         */
        start: function () {
            return this._super.apply(this, arguments).then(this.prepareWidgetOptions.bind(this));
        },
        /**
         * Set widget default value
         */
        setDefault: function () {},
        /**
         * get fields type
         */
        getFillFieldsType: function () {
            return [];
        },
        /**
         * Prepare widget options and update internal variable or config
         */
        prepareWidgetOptions: function () {
            var self = this;
            if (this.mode === 'edit') {
                var hasProperty = Object.prototype.hasOwnProperty;
                // update 'fillfields', 'component_form', 'delimiter' if exists
                if (this.attrs.options) {
                    if (hasProperty.call(this.attrs.options, 'force_override')) {
                        this.force_override = true;
                    }
                    if (hasProperty.call(this.attrs.options, 'component_form')) {
                        this.component_form = _.defaults(
                            {},
                            this.attrs.options.component_form,
                            this.component_form
                        );
                    }
                    if (hasProperty.call(this.attrs.options, 'delimiter')) {
                        this.fillfields_delimiter = _.defaults(
                            {},
                            this.attrs.options.delimiter,
                            this.fillfields_delimiter
                        );
                    }
                    if (hasProperty.call(this.attrs.options, 'lat')) {
                        this.lat = this.attrs.options.lat;
                    }
                    if (hasProperty.call(this.attrs.options, 'lng')) {
                        this.lng = this.attrs.options.lng;
                    }
                    if (hasProperty.call(this.attrs.options, 'address_form')) {
                        if (this.force_override) {
                            this.address_form = this.attrs.options.address_form;
                        } else {
                            this.address_form = _.defaults(
                                {},
                                this.attrs.options.address_form,
                                this.address_form
                            );
                        }
                    }
                    if (hasProperty.call(this.attrs.options, 'display_name')) {
                        this.display_name = this.attrs.options.display_name;
                    }
                }

                this.target_fields = this.getFillFieldsType();
                this.initGplacesAutocomplete().then(function () {
                    self._geolocate();
                });
            }
        },
        /**
         * Geolocate
         * @private
         */
        _geolocate: function () {
            var self = this;
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    var geolocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };

                    var circle = new google.maps.Circle({
                        center: geolocation,
                        radius: position.coords.accuracy,
                    });
                    if (self.places_autocomplete) {
                        self.places_autocomplete.setBounds(circle.getBounds());
                    }
                });
            }
        },
        /**
         * @private
         */
        _prepareValue: function (model, field_name, value) {
            model = model || false;
            field_name = field_name || false;
            value = value || false;
            return Utils.fetchValues(model, field_name, value);
        },
        /**
         * @private
         */
        _populateAddress: function (place, fillfields, delimiter) {
            place = place || false;
            fillfields = fillfields || this.fillfields;
            delimiter = delimiter || this.fillfields_delimiter;
            return Utils.gmaps_populate_address(place, fillfields, delimiter);
        },
        /**
         * Map google address into Odoo fields
         * @param {*} place
         * @param {*} fillfields
         */
        _populatePlaces: function (place, fillfields) {
            place = place || false;
            fillfields = fillfields || this.fillfields;
            return Utils.gmaps_populate_places(place, fillfields);
        },
        /**
         * Get country's state
         * @param {*} model
         * @param {*} country
         * @param {*} state
         */
        _getCountryState: function (model, country, state) {
            model = model || false;
            country = country || false;
            state = state || false;
            return Utils.fetchCountryState(model, country, state);
        },
        /**
         * Set country's state
         * @param {*} model
         * @param {*} country
         * @param {*} state
         */
        setCountryState: function (model, country, state) {
            var self = this;
            if (model && country && state) {
                this._getCountryState(model, country, state).then(function (result) {
                    var state = {
                        [self.address_form.state_id]: result,
                    };
                    self._onUpdateWidgetFields(state);
                });
            }
        },
        /**
         * @private
         */
        _setGeolocation: function (latitude, longitude) {
            var res = {};
            if (_.intersection(_.keys(this.record.fields), [this.lat, this.lng]).length === 2) {
                res[this.lat] = latitude;
                res[this.lng] = longitude;
            }
            return res;
        },
        /**
         * @private
         */
        _onUpdateWidgetFields: function (values) {
            values = values || {};
            this.trigger_up('field_changed', {
                dataPointID: this.dataPointID,
                changes: values,
                viewType: this.viewType,
            });
        },
        /**
         * Initialize google autocomplete
         * return promise
         */
        initGplacesAutocomplete: function () {
            return $.when();
        },
        /**
         * @override
         */
        destroy: function () {
            if (this.places_autocomplete) {
                this.places_autocomplete.unbindAll();
            }
            // Remove all PAC container in DOM if any
            $('.pac-container').remove();
            return this._super();
        },
        /**
         * List of Google autocomplete data fields, for more detail check on
         * https://developers.google.com/maps/documentation/javascript/places-autocomplete#specify-data-fields
         * @returns Array
         */
        get_google_fields_restriction:  function() {
            return []
        }
    });

    var GplacesAddressAutocompleteField = GplaceAutocomplete.extend({
        className: 'o_field_char o_field_google_address_autocomplete',
        /**
         * @override
         */
        setDefault: function () {
            this._super.apply(this, arguments);
            this.fillfields = {
                [this.address_form.street]: ['street_number', 'route'],
                [this.address_form.street2]: [
                    'administrative_area_level_3',
                    'administrative_area_level_4',
                    'administrative_area_level_5',
                ],
                [this.address_form.city]: ['locality'],
                [this.address_form.zip]: 'postal_code',
                [this.address_form.state_id]: 'administrative_area_level_1',
                [this.address_form.country_id]: 'country',
            };
        },
        /**
         * @override
         */
        prepareWidgetOptions: function () {
            if (this.mode === 'edit' && this.attrs.options) {
                if (Object.prototype.hasOwnProperty.call(this.attrs.options, 'force_override')) {
                    this.force_override = true;
                }
                if (Object.prototype.hasOwnProperty.call(this.attrs.options, 'fillfields')) {
                    if (this.force_override) {
                        this.fillfields = this.attrs.options.fillfields;
                    } else {
                        this.fillfields = _.defaults(
                            {},
                            this.attrs.options.fillfields,
                            this.fillfields
                        );
                    }
                }
            }
            this._super();
        },
        /**
         * Get fields attributes
         * @override
         */
        getFillFieldsType: function () {
            var self = this,
                res = this._super();
            if (this._isValid) {
                _.each(Object.keys(this.fillfields), function (field_name) {
                    res.push({
                        name: field_name,
                        type: self.record.fields[field_name].type,
                        relation: self.record.fields[field_name].relation,
                    });
                });
            }
            return res;
        },
        /**
         * Callback function for places_change event
         */
        handlePopulateAddress: function () {
            var place = this.places_autocomplete.getPlace();
            if (Object.prototype.hasOwnProperty.call(place, 'address_components')) {
                var google_address = this._populateAddress(place);
                this.populateAddress(place, google_address);
            }
        },
        /**
         * Populate address form the Google place
         * @param {*} place
         * @param {*} parse_address
         */
        populateAddress: function (place, parse_address) {
            var self = this;
            var requests = [];
            var index_of_state = _.findIndex(this.target_fields, function (f) {
                return f.name === self.address_form.state_id;
            });
            var target_fields = this.target_fields.slice();
            var field_state =
                index_of_state > -1 ? target_fields.splice(index_of_state, 1)[0] : false;

            _.each(target_fields, function (field) {
                requests.push(
                    self._prepareValue(field.relation, field.name, parse_address[field.name])
                );
            });
            // Set geolocation
            var partner_geometry = this._setGeolocation(
                place.geometry.location.lat(),
                place.geometry.location.lng()
            );
            _.each(partner_geometry, function (val, field) {
                requests.push(self._prepareValue(false, field, val));
            });

            Promise.all(requests).then(function (values) {
                var changes = {};
                _.each(values, function (vals) {
                    _.each(vals, function (val, key) {
                        if (typeof val === 'object') {
                            changes[key] = val;
                        } else {
                            changes[key] = self._parseValue(val);
                        }
                    });
                });
                self._onUpdateWidgetFields(changes);
                self.$input.val(parse_address[self.display_name] || place.name);

                if (field_state) {
                    var country = _.has(changes, self.address_form.country_id)
                        ? changes[self.address_form.country_id]['id']
                        : false;
                    var state_code = parse_address[self.address_form.state_id];
                    self.setCountryState(field_state.relation, country, state_code);
                }
            });
        },
        get_google_fields_restriction: function () {
            return [
                'address_components',
                'name',
                'geometry',
            ];
        },
        initGplacesAutocomplete: function () {
            var self = this;
            var def = $.Deferred();
            setTimeout(function () {
                if (!self.places_autocomplete) {
                    var google_fields = self.get_google_fields_restriction();
                    self.places_autocomplete = new google.maps.places.Autocomplete(
                        self.$input.get(0),
                        {
                            types: ['address'],
                            fields: google_fields,
                        }
                    );
                    if (self.autocomplete_settings) {
                        self.places_autocomplete.setOptions(self.autocomplete_settings);
                    }
                }
                // When the user selects an address from the dropdown, populate the address fields in the form.
                self.places_autocomplete.addListener(
                    'place_changed',
                    self.handlePopulateAddress.bind(self)
                );
                def.resolve();
            }, 300);
            return def.promise();
        },
        /**
         * @override
         */
        isValid: function () {
            this._super.apply(this, arguments);
            var self = this,
                unknown_fields;

            unknown_fields = _.filter(_.keys(self.fillfields), function (field) {
                return !Object.prototype.hasOwnProperty.call(self.record.fields, field);
            });
            if (unknown_fields.length > 0) {
                self.do_warn(
                    _t('The following fields are invalid:'),
                    _t('<ul><li>' + unknown_fields.join('</li><li>') + '</li></ul>')
                );
                this._isValid = false;
            }
            return this._isValid;
        },
        /**
         * @override
         */
        destroy: function () {
            if (this.places_autocomplete) {
                google.maps.event.clearInstanceListeners(this.places_autocomplete);
            }
            return this._super();
        },
    });

    var GplacesAutocompleteField = GplaceAutocomplete.extend({
        className: 'o_field_char o_field_google_places_autocomplete',
        setDefault: function () {
            this._super.apply(this);
            this.fillfields = {
                general: {
                    name: 'name',
                    website: 'website',
                    phone: ['international_phone_number', 'formatted_phone_number'],
                },
                address: {
                    street: ['street_number', 'route'],
                    street2: [
                        'administrative_area_level_3',
                        'administrative_area_level_4',
                        'administrative_area_level_5',
                    ],
                    city: 'locality',
                    zip: 'postal_code',
                    state_id: 'administrative_area_level_1',
                    country_id: 'country',
                },
            };
        },
        prepareWidgetOptions: function () {
            if (this.mode === 'edit' && this.attrs.options) {
                var hasProperty = Object.prototype.hasOwnProperty;
                if (hasProperty.call(this.attrs.options, 'force_override')) {
                    this.force_override = true;
                }
                if (hasProperty.call(this.attrs.options, 'fillfields')) {
                    if (hasProperty.call(this.attrs.options.fillfields, 'address')) {
                        if (this.force_override) {
                            this.fillfields['address'] = this.attrs.options.fillfields.address;
                        } else {
                            this.fillfields['address'] = _.defaults(
                                {},
                                this.attrs.options.fillfields.address,
                                this.fillfields.address
                            );
                        }
                    }
                    if (hasProperty.call(this.attrs.options.fillfields, 'general')) {
                        if (this.force_override) {
                            this.fillfields['general'] = this.attrs.options.fillfields.general;
                        } else {
                            this.fillfields['general'] = _.defaults(
                                {},
                                this.attrs.options.fillfields.general,
                                this.fillfields.general
                            );
                        }
                    }
                    if (hasProperty.call(this.attrs.options.fillfields, 'geolocation')) {
                        this.fillfields['geolocation'] = this.attrs.options.fillfields.geolocation;
                    }
                }
            }
            this._super();
        },
        getFillFieldsType: function () {
            var self = this,
                res = this._super();
            if (this._isValid) {
                _.each(this.fillfields, function (option) {
                    _.each(Object.keys(option), function (field_name) {
                        res.push({
                            name: field_name,
                            type: self.record.fields[field_name].type,
                            relation: self.record.fields[field_name].relation,
                        });
                    });
                });
            }
            return res;
        },
        _setGeolocation: function (lat, lng) {
            var res = {};
            if (this.lat && this.lng) {
                return this._super(lat, lng);
            } else if (this.fillfields.geolocation) {
                _.each(this.fillfields.geolocation, function (alias, field) {
                    if (alias === 'latitude') {
                        res[field] = lat;
                    }
                    if (alias === 'longitude') {
                        res[field] = lng;
                    }
                });
            }
            return res;
        },
        handlePopulateAddress: function () {
            var self = this;
            var place = this.places_autocomplete.getPlace();
            if (Object.prototype.hasOwnProperty.call(place, 'address_components')) {
                var values = {};
                var requests = [];
                var index_of_state = _.findIndex(this.target_fields, function (f) {
                    return f.name === self.address_form.state_id;
                });
                var target_fields = this.target_fields.slice();
                var field_state =
                    index_of_state > -1 ? target_fields.splice(index_of_state, 1)[0] : false;
                // Get address
                var google_address = this._populateAddress(
                    place,
                    this.fillfields.address,
                    this.fillfields_delimiter
                );
                _.extend(values, google_address);
                // Get place (name, website, phone)
                var google_place = this._populatePlaces(place, this.fillfields.general);
                _.extend(values, google_place);
                // Set place geolocation
                var google_geolocation = self._setGeolocation(
                    place.geometry.location.lat(),
                    place.geometry.location.lng()
                );
                _.extend(values, google_geolocation);

                _.each(target_fields, function (field) {
                    requests.push(
                        self._prepareValue(field.relation, field.name, values[field.name])
                    );
                });

                Promise.all(requests).then(function (values) {
                    var changes = {};
                    _.each(values, function (vals) {
                        _.each(vals, function (val, key) {
                            if (typeof val === 'object') {
                                changes[key] = val;
                            } else {
                                changes[key] = self._parseValue(val);
                            }
                        });
                    });
                    self._onUpdateWidgetFields(changes);
                    if (field_state) {
                        var country = _.has(changes, self.address_form.country_id)
                            ? changes[self.address_form.country_id]['id']
                            : false;
                        var state_code = google_address[self.address_form.state_id];
                        self.setCountryState(field_state.relation, country, state_code);
                    }
                    self.$input.val(changes[self.display_name] || place.name);
                });
            }
        },
        get_google_fields_restriction: function () {
            return [
                'address_components',
                'name',
                'website',
                'geometry',
                'international_phone_number',
                'formatted_phone_number',
            ];
        },
        initGplacesAutocomplete: function () {
            var self = this;
            var def = $.Deferred();
            setTimeout(function () {
                if (!self.places_autocomplete) {
                    var google_fields = self.get_google_fields_restriction();
                    self.places_autocomplete = new google.maps.places.Autocomplete(
                        self.$input.get(0),
                        {
                            types: ['establishment'],
                            fields: google_fields,
                        }
                    );
                    if (self.autocomplete_settings) {
                        self.places_autocomplete.setOptions(self.autocomplete_settings);
                    }
                }
                // When the user selects an address from the dropdown, populate the address fields in the form.
                self.places_autocomplete.addListener(
                    'place_changed',
                    self.handlePopulateAddress.bind(self)
                );
                def.resolve(self);
            }, 300);
            return def.promise();
        },
        /**
         * @override
         */
        isValid: function () {
            this._super.apply(this, arguments);
            var self = this,
                unknown_fields;
            for (var option in this.fillfields) {
                unknown_fields = _.filter(_.keys(this.fillfields[option]), function (field) {
                    return !Object.prototype.hasOwnProperty.call(self.record.fields, field);
                });
                if (unknown_fields.length > 0) {
                    self.do_warn(
                        _t('The following fields are invalid:'),
                        _t('<ul><li>' + unknown_fields.join('</li><li>') + '</li></ul>')
                    );
                    this._isValid = false;
                }
            }
            return this._isValid;
        },
        /**
         * @override
         */
        destroy: function () {
            if (this.places_autocomplete) {
                google.maps.event.clearInstanceListeners(this.places_autocomplete);
            }
            return this._super();
        },
    });

    return {
        GplacesAddressAutocompleteField: GplacesAddressAutocompleteField,
        GplacesAutocompleteField: GplacesAutocompleteField,
    };
});
