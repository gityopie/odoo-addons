odoo.define('web_google_maps.GplaceAutocompleteFields', function (require) {
    'use strict';

    var BasicFields = require('web.basic_fields');
    var core = require('web.core');
    var Utils = require('web_google_maps.Utils');
    var _t = core._t;

    var GplaceAutocomplete = BasicFields.InputField.extend({
        className: 'o_field_char o_field_google_autocomplete',
        tagName: 'span',
        supportedFieldTypes: ['char'],
        events: _.extend({}, BasicFields.InputField.prototype.events, {
            'focus': '_geolocate'
        }),
        /**
         * @override
         */
        init: function () {
            this._super.apply(this, arguments);

            this._type_relations = ['one2many', 'many2one', 'many2many'];
            this.places_autocomplete = false;
            this.component_form = Utils.GOOGLE_PLACES_COMPONENT_FORM;
            this.address_form = Utils.ADDRESS_FORM;
            this.fillfields_delimiter = {
                street: " ",
                street2: ", ",
            };
            this.fillfields = {};
            this.lng = false;
            this.lat = false;
            this.setDefault();
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
         * Prepare widget options
         */
        prepareWidgetOptions: function () {
            if (this.mode === 'edit') {
                // update  'component_form', 'delimiter' if exists
                if (this.attrs.options) {
                    if (this.attrs.options.hasOwnProperty('component_form')) {
                        this.component_form = _.defaults({}, this.attrs.options.component_form, this.component_form);
                    }
                    if (this.attrs.options.hasOwnProperty('delimiter')) {
                        this.fillfields_delimiter = _.defaults({}, this.attrs.options.delimiter, this.fillfields_delimiter);
                    }
                    if (this.attrs.options.hasOwnProperty('lat')) {
                        this.lat = this.attrs.options.lat;
                    }
                    if (this.attrs.options.hasOwnProperty('lng')) {
                        this.lng = this.attrs.options.lng;
                    }
                    if (this.attrs.options.hasOwnProperty('address_form')) {
                        this.address_form = _.defaults({}, this.attrs.options.address_form, this.address_form);
                    }
                }
                this.target_fields = this.getFillFieldsType();
            }
        },
        /**
         * To be overriden
         */
        getFillFieldsType: function () {
            return [];
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
        /**
         * @private
         */
        _prepareValue: function (model, field_name, value) {
            var model = model || false;
            var field_name = field_name || false;
            var value = value || false;
            return Utils.fetchValues(model, field_name, value);
        },
        /**
         * @private
         */
        _populateAddress: function (place, fillfields, delimiter) {
            var place = place || false;
            var fillfields = fillfields || this.fillfields;
            var delimiter = delimiter || this.fillfields_delimiter;
            return Utils.gmaps_populate_address(place, fillfields, delimiter);
        },
        /**
         * @private
         */
        _populatePlaces: function (place, fillfields) {
            var place = place || false;
            var fillfields = fillfields || this.fillfields;
            return Utils.gmaps_populate_places(place, fillfields);
        },
        /**
         * @private
         */
        _getCountryState: function (model, country, state) {
            var model = model || false;
            var country = country || false;
            var state = state || false;
            return Utils.fetchCountryState(model, country, state);
        },
        /**
         * @private
         */
        _setGeolocation: function (latitude, longitude) {
            var res = {};
            if (_.intersection(_.keys(this.record.fields), [this.lat, this.lng]).length == 2) {
                res[this.lat] = latitude;
                res[this.lng] = longitude;
            }
            return res;
        },
        /**
         * @private
         */
        _onUpdateWidgetFields: function (changes) {
            var changes = changes || {};
            this.trigger_up('field_changed', {
                dataPointID: this.dataPointID,
                changes: changes,
                viewType: this.viewType,
            });
        },
        /**
         * @override 
         */
        _renderEdit: function () {
            this._super.apply(this, arguments);
            if (this.isValid()) {
                this._initGplacesAutocomplete();
            }
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
        }

    });

    var GplaceAddressAutocompleteField = GplaceAutocomplete.extend({
        setDefault: function () {
            this._super.apply(this, arguments);
            this.fillfields = {
                [this.address_form.street]: ['street_number', 'route'],
                [this.address_form.street2]: ['administrative_area_level_3', 'administrative_area_level_4', 'administrative_area_level_5'],
                [this.address_form.city]: ['locality', 'administrative_area_level_2'],
                [this.address_form.zip]: 'postal_code',
                [this.address_form.state_id]: 'administrative_area_level_1',
                [this.address_form.country_id]: 'country'
            };
        },
        /**
         * @override
         */
        prepareWidgetOptions: function () {
            if (this.mode === 'edit' && this.attrs.options) {
                if (this.attrs.options.hasOwnProperty('fillfields')) {
                    this.fillfields = _.defaults({}, this.attrs.options.fillfields, this.fillfields);
                }
            }
            this._super();
        },
        /**
         * Get fields attributes
         * @override
         */
        getFillFieldsType: function () {
            var self = this;
            var field;
            var res = this._super();
            if (this._isValid) {
                _.each(this.fillfields, function (val, name) {
                    if (_.contains(self._type_relations, self.record.fields[name].type)) {
                        field = {
                            name: name,
                            type: self.record.fields[name].type,
                            relation: self.record.fields[name].relation
                        };
                        res.push(field);
                    } else {
                        field = {
                            name: name,
                            type: self.record.fields[name].type,
                            relation: false
                        };
                        res.push(field);
                    }
                });
            }
            return res;
        },
        _initGplacesAutocomplete: function () {
            var self = this;
            if (!this.places_autocomplete) {
                this.places_autocomplete = new google.maps.places.Autocomplete(this.$input.get(0), {
                    types: ['address']
                });
            }
            // When the user selects an address from the dropdown, populate the address fields in the form.
            this.place_listener = this.places_autocomplete.addListener('place_changed', function () {
                var requests = [];
                var place = this.getPlace();
                if (place.hasOwnProperty('address_components')) {
                    var google_address = self._populateAddress(place);
                    _.each(self.target_fields, function (field) {
                        requests.push(self._prepareValue(field.relation, field.name, google_address[field.name]));
                    });

                    var partner_geometry = self._setGeolocation(place.geometry.location.lat(), place.geometry.location.lng());
                    _.each(partner_geometry, function (val, field) {
                        requests.push(self._prepareValue(false, field, val));
                    });

                    $.when.apply($, requests).done(function () {
                        var changes = {};
                        _.each(arguments, function (data, idx) {
                            _.each(data, function (val, key) {
                                if (typeof val === 'object') {
                                    changes[key] = val;
                                } else {
                                    changes[key] = self._parseValue(val);
                                }
                            });
                        });
                        if (!changes[self.address_form.state_id] &&
                            changes[self.address_form.country_id].hasOwnProperty('id') &&
                            google_address[self.address_form.state_id]) {
                                var state_id = _.find(self.target_fields, function(field) {
                                    return field.name === self.address_form.state_id;
                                })
                                if (!state_id) return;
                                self._getCountryState(
                                    state_id.relation,
                                    changes[self.address_form.country_id].id,
                                    google_address[self.address_form.state_id]
                                ).then(function (result) {
                                    var state = {
                                        [self.address_form.state_id]: result.length == 1 ? result[0] : false,
                                    }
                                    _.extend(changes, state);
                                    self._onUpdateWidgetFields(changes);
                                });
                        } else {
                            self._onUpdateWidgetFields(changes);
                        }
                    });
                    self.$input.val(google_address[self.name]);
                }
            });
        },
        /**
         * @override
         */
        isValid: function () {
            this._super.apply(this, arguments);
            var self = this,
                unknown_fields;

            unknown_fields = _.filter(_.keys(self.fillfields), function (field) {
                return !self.record.fields.hasOwnProperty(field);
            });
            if (unknown_fields.length > 0) {
                self.do_warn(_t('The following fields are invalid:'), _t('<ul><li>' + unknown_fields.join('</li><li>') + '</li></ul>'));
                this._isValid = false;
            }
            return this._isValid;
        },
        /**
         * @override
         */
        destroy: function () {
            if (this.places_autocomplete) {
                google.maps.event.removeListener(this.place_listener);
                google.maps.event.clearInstanceListeners(this.places_autocomplete);
            }
            return this._super();
        }
    });

    var GplacesAutocompleteField = GplaceAutocomplete.extend({
        setDefault: function () {
            this._super.apply(this);
            this.fillfields = {
                general: {
                    name: 'name',
                    website: 'website',
                    phone: ['international_phone_number', 'formatted_phone_number']
                },
                address: {
                    [this.address_form.street]: ['street_number', 'route'],
                    [this.address_form.street2]: ['administrative_area_level_3', 'administrative_area_level_4', 'administrative_area_level_5'],
                    [this.address_form.city]: ['locality', 'administrative_area_level_2'],
                    [this.address_form.zip]: 'postal_code',
                    [this.address_form.state_id]: 'administrative_area_level_1',
                    [this.address_form.country_id]: 'country'
                }
            };
        },
        prepareWidgetOptions: function () {
            if (this.mode === 'edit' && this.attrs.options) {
                if (this.attrs.options.hasOwnProperty('fillfields')) {
                    if (this.attrs.options.fillfields.hasOwnProperty('address')) {
                        this.fillfields['address'] = _.defaults({}, this.attrs.options.fillfields.address, this.fillfields.address);
                    }
                    if (this.attrs.options.fillfields.hasOwnProperty('general')) {
                        this.fillfields['general'] = _.defaults({}, this.attrs.options.fillfields.general, this.fillfields.general);
                    }
                    if (this.attrs.options.fillfields.hasOwnProperty('geolocation')) {
                        this.fillfields['geolocation'] = this.attrs.options.fillfields.geolocation;
                    }
                }
            }
            this._super();
        },
        getFillFieldsType: function () {
            var self = this;
            var field;
            var res = this._super();
            if (this._isValid) {
                for (var option in this.fillfields) {
                    _.each(this.fillfields[option], function (val, name) {
                        if (_.contains(self._type_relations, self.record.fields[name].type)) {
                            field = {
                                name: name,
                                type: self.record.fields[name].type,
                                relation: self.record.fields[name].relation
                            };
                            res.push(field);
                        } else {
                            field = {
                                name: name,
                                type: self.record.fields[name].type,
                                relation: false
                            };
                            res.push(field);
                        }
                    });
                }
            }
            return res;
        },
        _setGeolocation: function (lat, lng) {
            var res = {};
            if (this.lat && this.lng) {
                var _res = this._super(lat, lng);
                return _res;
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
        _initGplacesAutocomplete: function () {
            var self = this;
            this.places_autocomplete = new google.maps.places.Autocomplete(this.$input.get(0), {
                types: ['establishment']
            });
            // When the user selects an address from the dropdown, populate the address fields in the form.
            this.place_listener = this.places_autocomplete.addListener('place_changed', function () {
                var values = {},
                    requests = [],
                    place;
                place = this.getPlace();
                if (place.hasOwnProperty('address_components')) {
                    // Get address
                    var google_address = self._populateAddress(place, self.fillfields.address, self.fillfields_delimiter);
                    _.extend(values, google_address);
                    // Get place (name, website, phone)
                    var google_place = self._populatePlaces(place, self.fillfields.general);
                    _.extend(values, google_place);
                    // Get place geolocation
                    var google_geolocation = self._setGeolocation(place.geometry.location.lat(), place.geometry.location.lng());
                    _.extend(values, google_geolocation);

                    _.each(self.target_fields, function (field) {
                        requests.push(self._prepareValue(field.relation, field.name, values[field.name]));
                    });

                    $.when.apply($, requests).done(function () {
                        var changes = {}
                        _.each(arguments, function (data, idx) {
                            _.each(data, function (val, key) {
                                if (typeof val === 'object') {
                                    changes[key] = val;
                                } else {
                                    changes[key] = self._parseValue(val);
                                }
                            });
                        });
                        if (!changes[self.address_form.state_id] &&
                            changes[self.address_form.country_id].hasOwnProperty('id') &&
                            google_address[self.address_form.state_id]) {
                                var state_id = _.find(self.target_fields, function(field) {
                                    return field.name === self.address_form.state_id;
                                })
                                if (!state_id) return;
                                self._getCountryState(
                                    state_id.relation,
                                    changes[self.address_form.country_id].id,
                                    google_address[self.address_form.state_id]
                                ).then(function (result) {
                                    var state = {
                                        [self.address_form.state_id]: result.length == 1 ? result[0] : false,
                                    }
                                    _.extend(changes, state);
                                    self._onUpdateWidgetFields(changes);
                                });
                        } else {
                            self._onUpdateWidgetFields(changes);
                        }
                    });
                    self.$input.val(place.name);
                }
            });
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
                    return !self.record.fields.hasOwnProperty(field);
                });
                if (unknown_fields.length > 0) {
                    self.do_warn(_t('The following fields are invalid:'), _t('<ul><li>' + unknown_fields.join('</li><li>') + '</li></ul>'));
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
                google.maps.event.removeListener(this.place_listener);
                google.maps.event.clearInstanceListeners(this.$input.get(0));
            }
            return this._super();
        }
    });

    return {
        GplacesAddressAutocompleteField: GplaceAddressAutocompleteField,
        GplacesAutocompleteField: GplacesAutocompleteField
    };

});