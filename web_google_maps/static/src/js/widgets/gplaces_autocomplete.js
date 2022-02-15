odoo.define('web_google_maps.GplaceAutocompleteFields', function (require) {
    'use strict';

    const BasicFields = require('web.basic_fields');
    const core = require('web.core');
    const Utils = require('web_google_maps.Utils');
    const _t = core._t;

    const GplaceAutocomplete = BasicFields.InputField.extend({
        tagName: 'span',
        supportedFieldTypes: ['char'],
        /**
         * @override
         */
        init: function () {
            this._super.apply(this, arguments);
            this.places_autocomplete = false;
            this.component_form = Utils.GOOGLE_PLACES_COMPONENT_FORM;
            this.address_form = Utils.ADDRESS_FORM;
            this.fillfields_delimiter = {
                street: ' ',
                street2: ', ',
            };
            this.fillfields = {};
            // Fields to be filled when place/address is selected
            this.fillfields = {};
            // Longitude, field's name that hold longitude
            this.lng = false;
            // Latitude, field's name that hold latitude
            this.lat = false;
            // Google address form/places instance attribute to be assigned to the field
            this.display_name = 'name';
            // Utilize the default `fillfields` and then combined it with the fillfields options given if any
            // or overwrite the default values and used the `fillfields` provided in the view options instead.
            // This option will be applied only on `fillfields` and `address_form`
            this.force_override = false;
            this.autocomplete_settings = null;
        },
        /**
         * @override
         */
        willStart: function () {
            this.setDefault();
            const getSettings = this._rpc({
                route: '/web/google_autocomplete_conf',
            }).then((res) => {
                this.autocomplete_settings = res;
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
         * Prepare widget options
         */
        prepareWidgetOptions: async function () {
            if (this.mode === 'edit') {
                // update 'fillfields', 'component_form', 'delimiter' if exists
                if (this.attrs.options) {
                    if (this.attrs.options.hasOwnProperty('component_form')) {
                        this.component_form = _.defaults({}, this.attrs.options.component_form, this.component_form);
                    }
                    if (this.attrs.options.hasOwnProperty('delimiter')) {
                        this.fillfields_delimiter = _.defaults(
                            {},
                            this.attrs.options.delimiter,
                            this.fillfields_delimiter
                        );
                    }
                    if (this.attrs.options.hasOwnProperty('lat')) {
                        this.lat = this.attrs.options.lat;
                    }
                    if (this.attrs.options.hasOwnProperty('lng')) {
                        this.lng = this.attrs.options.lng;
                    }
                    if (this.attrs.options.hasOwnProperty('address_form')) {
                        if (this.force_override) {
                            this.address_form = this.attrs.options.address_form;
                        } else {
                            this.address_form = _.defaults({}, this.attrs.options.address_form, this.address_form);
                        }
                    }
                    if (this.attrs.options.hasOwnProperty('display_name')) {
                        this.display_name = this.attrs.options.display_name;
                    }
                }

                this.target_fields = this.getFillFieldsType();
                const self = await this.initGplacesAutocomplete();
                self._geolocate();
            }
        },
        /**
         * Geolocate
         * @private
         */
        _geolocate: function () {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    const geolocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };

                    const circle = new google.maps.Circle({
                        center: geolocation,
                        radius: position.coords.accuracy,
                    });

                    this.places_autocomplete.setBounds(circle.getBounds());
                });
            }
        },
        /**
         * @private
         */
        _prepareValue: function (model, field_name, value) {
            model = typeof model !== 'undefined' ? model : false;
            field_name = typeof field_name !== 'undefined' ? field_name : false;
            value = typeof value !== 'undefined' ? value : false;
            return Utils.fetchValues(model, field_name, value);
        },
        /**
         * @private
         */
        _populateAddress: function (place, fillfields, delimiter) {
            place = typeof place !== 'undefined' ? place : false;
            fillfields = typeof fillfields !== 'undefined' ? fillfields : this.fillfields;
            delimiter = typeof delimiter !== 'undefined' ? delimiter : this.fillfields_delimiter;
            return Utils.gmaps_populate_address(place, fillfields, delimiter);
        },
        /**
         * Map google address into Odoo fields
         * @param {*} place
         * @param {*} fillfields
         */
        _populatePlaces: function (place, fillfields) {
            place = typeof place !== 'undefined' ? place : false;
            fillfields = typeof fillfields !== 'undefined' ? fillfields : this.fillfields;
            return Utils.gmaps_populate_places(place, fillfields);
        },
        /**
         * Get country's state
         * @param {*} model
         * @param {*} country
         * @param {*} state
         */
        _getCountryState: function (model, country, state) {
            model = typeof model !== 'undefined' ? model : false;
            country = typeof country !== 'undefined' ? country : false;
            state = typeof state !== 'undefined' ? state : false;
            return Utils.fetchCountryState(model, country, state);
        },
        /**
         * Set country's state
         * @param {*} model
         * @param {*} country
         * @param {*} state
         */
        setCountryState: async function (model, country, state) {
            if (model && country && state) {
                const result = await this._getCountryState(model, country, state);
                const value = { [this.address_form.state_id]: result };
                this._onUpdateWidgetFields(value);
            }
        },
        /**
         * Set geolocation fields
         * @param {*} latitude
         * @param {*} longitude
         */
        _setGeolocation: function (latitude, longitude) {
            const res = {};
            if (_.intersection(_.keys(this.record.fields), [this.lat, this.lng]).length === 2) {
                res[this.lat] = latitude;
                res[this.lng] = longitude;
            }
            return res;
        },
        /**
         * Apply the changes
         * @param {*} values
         */
        _onUpdateWidgetFields: function (values) {
            values = typeof values !== 'undefined' ? values : {};
            this.trigger_up('field_changed', {
                dataPointID: this.dataPointID,
                changes: values,
                viewType: this.viewType,
            });
        },
        /**
         * Initialize google autocomplete
         * Return promise
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
        get_google_fields_restriction: function () {
            return [];
        },
    });

    const GplaceAddressAutocompleteField = GplaceAutocomplete.extend({
        className: 'o_field_char o_field_google_address_autocomplete',
        /**
         * @param {*} values
         */
        _onUpdateWidgetFields: function (values) {
            values = typeof values !== 'undefined' ? values : {};
            if (values.hasOwnProperty(this.lat) || values.hasOwnProperty(this.lng)) {
                const geometry = {
                    [this.lat]: values[this.lat],
                    [this.lng]: values[this.lng],
                };
                // need to delay the call to apply the geolocation fields
                // send these value with address fields won't update the geolocation fields
                setTimeout(() => {
                    this.trigger_up('field_changed', {
                        dataPointID: this.dataPointID,
                        changes: geometry,
                        viewType: this.viewType,
                    });
                }, 500);
                delete values[this.lat];
                delete values[this.lng];
            }
            this.trigger_up('field_changed', {
                dataPointID: this.dataPointID,
                changes: values,
                viewType: this.viewType,
            });
        },
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
                [this.address_form.city]: ['locality', 'administrative_area_level_2'],
                [this.address_form.zip]: 'postal_code',
                [this.address_form.state_id]: 'administrative_area_level_1',
                [this.address_form.country_id]: 'country',
            };
            // possible value: `address_format` or `no_address_format`
            // address_format: widget will populate address returned by Google to Odoo address fields
            // no_address_format: no populate address, will take address and the geolocation data.
            this.address_mode = 'address_format';
            // Autocomplete request types
            this.autocomplete_types = ['address'];
        },
        /**
         * @override
         */
        prepareWidgetOptions: function () {
            if (this.attrs.options) {
                if (this.attrs.options.hasOwnProperty('mode')) {
                    this.address_mode =
                        Utils.ADDRESS_MODE.indexOf(this.attrs.options.mode) != -1
                            ? this.attrs.options.mode
                            : 'address_format';
                }
                if (this.edit === 'edit') {
                    if (this.attrs.options.hasOwnProperty('force_override')) {
                        this.force_override = true;
                    }
                    if (this.attrs.options.hasOwnProperty('fillfields')) {
                        if (this.force_override) {
                            this.fillfields = this.attrs.options.fillfields;
                        } else {
                            this.fillfields = _.defaults({}, this.attrs.options.fillfields, this.fillfields);
                        }
                    }
                    if (this.attrs.options.hasOwnProperty('types')) {
                        this.autocomplete_types = this.attrs.options.types;
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
            const res = this._super();

            if (this._isValid && this.address_mode === 'address_format') {
                _.each(Object.keys(this.fillfields), (field_name) => {
                    res.push({
                        name: field_name,
                        type: this.record.fields[field_name].type,
                        relation: this.record.fields[field_name].relation,
                    });
                });
            }
            return res;
        },
        /**
         * Callback function for places_change event
         */
        handlePopulateAddress: function () {
            const place = this.places_autocomplete.getPlace();
            if (this.address_mode === 'no_address_format') {
                const location_geometry = this._setGeolocation(
                    place.geometry.location.lat(),
                    place.geometry.location.lng()
                );
                this.$input.val(place[this.display_name] || place.name);
                this._onUpdateWidgetFields(location_geometry);
            } else if (place.hasOwnProperty('address_components')) {
                const google_address = this._populateAddress(place);
                this.populateAddress(place, google_address);
                this.$input.val(place.name);
            }
        },
        /**
         * Populate address form the Google place
         * @param {*} place
         * @param {*} parse_address
         */
        populateAddress: async function (place, parse_address) {
            const requests = [];
            let index_of_state = _.findIndex(this.target_fields, (f) => f.name === this.address_form.state_id);
            const target_fields = this.target_fields.slice();
            const field_state = index_of_state > -1 ? target_fields.splice(index_of_state, 1)[0] : false;

            _.each(target_fields, (field) => {
                requests.push(this._prepareValue(field.relation, field.name, parse_address[field.name]));
            });
            // Set geolocation
            const partner_geometry = this._setGeolocation(place.geometry.location.lat(), place.geometry.location.lng());
            _.each(partner_geometry, (val, field) => {
                requests.push(this._prepareValue(false, field, val));
            });

            const result = await Promise.all(requests);
            const changes = {};
            _.each(result, (vals) => {
                _.each(vals, (val, key) => {
                    if (typeof val === 'object') {
                        changes[key] = val;
                    } else {
                        changes[key] = this._parseValue(val);
                    }
                });
            });
            this._onUpdateWidgetFields(changes);
            this.$input.val(parse_address[this.display_name] || place.name);
            if (field_state) {
                const country = _.has(changes, this.address_form.country_id)
                    ? changes[this.address_form.country_id]['id']
                    : false;
                const state_code = parse_address[this.address_form.state_id];
                this.setCountryState(field_state.relation, country, state_code);
            }
        },
        /**
         * @override
         * @return {Object}
         */
        get_google_fields_restriction: function () {
            return ['address_components', 'name', 'geometry', 'formatted_address'];
        },
        /**
         * Override
         * Initialiaze places autocomplete
         */
        initGplacesAutocomplete: function () {
            return new Promise((resolve) => {
                setTimeout(() => {
                    if (!this.places_autocomplete) {
                        const google_fields = this.get_google_fields_restriction();
                        this.places_autocomplete = new google.maps.places.Autocomplete(this.$input.get(0), {
                            types: this.autocomplete_types,
                            fields: google_fields,
                        });
                        if (this.autocomplete_settings) {
                            this.places_autocomplete.setOptions(this.autocomplete_settings);
                        }
                    }
                    // When the user selects an address from the dropdown, populate the address fields in the form.
                    this.places_autocomplete.addListener('place_changed', this.handlePopulateAddress.bind(this));
                    resolve(this);
                }, 300);
            });
        },
        /**
         * @override
         */
        isValid: function () {
            this._super.apply(this, arguments);
            this._isValid = true;
            let unknown_fields;
            if (this.address_mode === 'address_format') {
                let fields = _.keys(this.fillfields);
                if (this.lat && this.lng) {
                    fields = fields.concat([this.lat, this.lng]);
                }
                unknown_fields = _.filter(fields, (field) => !this.record.fields.hasOwnProperty(field));
            } else if (this.address_mode === 'no_address_format' && this.lat && this.lng) {
                unknown_fields = _.filter([this.lat, this.lng], (field) => !this.record.fields.hasOwnProperty(field));
            }
            if (unknown_fields && unknown_fields.length > 0) {
                this.displayNotification({
                    message: _t(
                        'The following fields are invalid: <ul><li>' + unknown_fields.join('</li><li>') + '</li></ul>'
                    ),
                    type: 'warning',
                });
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

    const GplacesAutocompleteField = GplaceAutocomplete.extend({
        className: 'o_field_char o_field_google_places_autocomplete',
        setDefault: function () {
            this._super.apply(this, arguments);
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
                    city: ['locality', 'administrative_area_level_2'],
                    zip: 'postal_code',
                    state_id: 'administrative_area_level_1',
                    country_id: 'country',
                },
            };
            this.address_mode = 'address_format';
            // Autocomplete request types
            this.autocomplete_types = ['establishment'];
        },
        prepareWidgetOptions: function () {
            if (Object.prototype.hasOwnProperty.call(this.attrs.options, 'mode')) {
                console.warn('Option `mode` are not supported!');
            }
            if (this.mode === 'edit' && this.attrs.options) {
                if (Object.prototype.hasOwnProperty.call(this.attrs.options, 'force_override')) {
                    this.force_override = true;
                }
                if (this.attrs.options.hasOwnProperty('fillfields')) {
                    if (this.attrs.options.fillfields.hasOwnProperty('address')) {
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
                    if (this.attrs.options.fillfields.hasOwnProperty('general')) {
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
                    if (this.attrs.options.fillfields.hasOwnProperty('geolocation')) {
                        this.fillfields['geolocation'] = this.attrs.options.fillfields.geolocation;
                    }
                }
            }
            this._super();
        },
        getFillFieldsType: function () {
            const res = this._super();
            if (this._isValid && this.address_mode === 'address_format') {
                _.each(this.fillfields, (option) => {
                    _.each(Object.keys(option), (field_name) => {
                        res.push({
                            name: field_name,
                            type: this.record.fields[field_name].type,
                            relation: this.record.fields[field_name].relation,
                        });
                    });
                });
            }
            return res;
        },
        _onUpdateWidgetFields: function (values) {
            values = typeof values !== 'undefined' ? values : {};
            let geometry = {};
            if (this.lat && this.lng) {
                geometry[this.lat] = values[this.lat];
                geometry[this.lng] = values[this.lng];
            } else if (this.fillfields.geolocation) {
                _.each(this.fillfields.geolocation, (alias, field) => {
                    if (alias === 'latitude' && values[field]) {
                        geometry[field] = values[field];
                    }
                    if (alias === 'longitude' && values[field]) {
                        geometry[field] = values[field];
                    }
                });
            }
            if (Object.keys(geometry).length > 0) {
                setTimeout(() => {
                    this.trigger_up('field_changed', {
                        dataPointID: this.dataPointID,
                        changes: geometry,
                        viewType: this.viewType,
                    });
                }, 500);
                Object.keys(geometry).forEach((field) => delete values[field]);
            }
            this.trigger_up('field_changed', {
                dataPointID: this.dataPointID,
                changes: values,
                viewType: this.viewType,
            });
        },
        /**
         *
         * @param {number} num
         * @param {number} lng
         */
        _setGeolocation: function (lat, lng) {
            const res = {};
            if (this.lat && this.lng) {
                return this._super(lat, lng);
            } else if (this.fillfields.geolocation) {
                _.each(this.fillfields.geolocation, (alias, field) => {
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
        handlePopulateAddress: async function () {
            const place = this.places_autocomplete.getPlace();
            if (place.hasOwnProperty('address_components')) {
                const values = {};
                const requests = [];
                const index_of_state = _.findIndex(this.target_fields, (f) => f.name === this.address_form.state_id);
                const target_fields = this.target_fields.slice();
                const field_state = index_of_state > -1 ? target_fields.splice(index_of_state, 1)[0] : false;
                // Get address
                const google_address = this._populateAddress(place, this.fillfields.address, this.fillfields_delimiter);
                _.extend(values, google_address);
                // Get place (name, website, phone)
                const google_place = this._populatePlaces(place, this.fillfields.general);
                _.extend(values, google_place);
                // Set place geolocation
                const google_geolocation = this._setGeolocation(
                    place.geometry.location.lat(),
                    place.geometry.location.lng()
                );
                _.extend(values, google_geolocation);

                _.each(target_fields, (field) => {
                    requests.push(this._prepareValue(field.relation, field.name, values[field.name]));
                });

                const result = await Promise.all(requests);
                const changes = {};
                _.each(result, (vals) => {
                    _.each(vals, (val, key) => {
                        if (typeof val === 'object') {
                            changes[key] = val;
                        } else {
                            changes[key] = this._parseValue(val);
                        }
                    });
                });
                this._onUpdateWidgetFields(changes);
                if (field_state) {
                    const country = _.has(changes, this.address_form.country_id)
                        ? changes[this.address_form.country_id]['id']
                        : false;
                    const state_code = google_address[this.address_form.state_id];
                    this.setCountryState(field_state.relation, country, state_code);
                }
                this.$input.val(changes[this.display_name] || place.name);
            }
        },
        /**
         * @override
         */
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
            return new Promise((resolve) => {
                setTimeout(() => {
                    if (!this.places_autocomplete) {
                        const google_fields = this.get_google_fields_restriction();
                        this.places_autocomplete = new google.maps.places.Autocomplete(this.$input.get(0), {
                            types: this.autocomplete_types,
                            fields: google_fields,
                        });
                        if (this.autocomplete_settings) {
                            this.places_autocomplete.setOptions(this.autocomplete_settings);
                        }
                    }
                    // When the user selects an address from the dropdown, populate the address fields in the form.
                    this.places_autocomplete.addListener('place_changed', this.handlePopulateAddress.bind(this));
                    resolve(this);
                }, 300);
            });
        },
        /**
         * @override
         */
        isValid: function () {
            this._super.apply(this, arguments);
            let unknown_fields = null;
            const invalid_fields = [];
            for (let option in this.fillfields) {
                unknown_fields = _.filter(
                    _.keys(this.fillfields[option]),
                    (field) => !this.record.fields.hasOwnProperty(field)
                );
                if (unknown_fields.length > 0) {
                    this.displayNotification({
                        message: _t(
                            'The following fields are invalid: <ul><li>' +
                                unknown_fields.join('</li><li>') +
                                '</li></ul>'
                        ),
                        type: 'warning',
                    });
                    invalid_fields.push(unknown_fields);
                }
            }
            this._isValid = !(invalid_fields.length > 0);
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
        GplacesAddressAutocompleteField: GplaceAddressAutocompleteField,
        GplacesAutocompleteField: GplacesAutocompleteField,
    };
});
