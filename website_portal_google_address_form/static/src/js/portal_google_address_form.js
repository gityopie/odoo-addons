odoo.define('website_portal_google_address_form.portal_google_address_form', function (require) {
    'use strict';

    var publicWidget = require('web.public.widget');
    var ajax = require('web.ajax');
    var googleUtils = require('web_google_maps.Utils');
    var googleScriptLoaded = $.Deferred();
    

    publicWidget.registry.PortalGoogleAddressForm = publicWidget.Widget.extend(googleUtils.GoogleAutocompleteMixin, {
        selector: '.o_portal_details',
        events: {
            'keypress form': '_disableEnterKey'
        },
        /**
         * Input elements on the form/page that will be fulfilled
         */
        streetFillInputs: {
            street: {
                selector: 'input[name="street"]',
                components: [], // The main element that will be attached the autocomplete. No need to provide components like other input element as we will assigned it with place.name
            },
            street2: {
                selector: 'input[name="street2"]',
                components: ['administrative_area_level_3', 'administrative_area_level_4', 'administrative_area_level_5']
            },
            city: {
                selector: 'input[name="city"]',
                components: ['locality', 'administrative_area_level_2']
            },
            zipcode: {
                selector: 'input[name="zipcode"]',
                components: ['postal_code']
            },
            country_id: {
                selector: 'select[name="country_id"]',
                components: ['country']
            },
            state_id: {
                selector: 'select[name="state_id"]',
                components: ['administrative_area_level_1']
            }
        },
        /**
         * Disable the 'enter' key that trigger form submit
         * @param {*} ev 
         * @returns 
         */
        _disableEnterKey: function (ev) {
            var key_code = ev.keyCode || ev.which;
            if (key_code === 13) {
                ev.preventDefault();
                return false;
            }
        },
        start: function () {
            var defs = [this._super.apply(this, arguments)];

            if (typeof google !== 'object' || typeof google.maps !== 'object') {
                if (!publicWidget.registry.PortalGoogleAddressForm.isScriptLoading) {
                    publicWidget.registry.PortalGoogleAddressForm.isScriptLoading = true;

                    window.portal_google_address_form = function portal_google_address_form() {
                        publicWidget.registry.PortalGoogleAddressForm.isScriptLoading = false;
                        googleScriptLoaded.resolve();
                    };

                    defs.push(
                        this._rpc({
                            route: '/gplaces/google_maps_api_key',
                        }).then(function (data) {
                            var data_json = JSON.parse(data);
                            if (!data_json.google_maps_api_key) {
                                console.warn('Cannot initialize Google address form autocomplete, check your configuration!. ' + window.location.origin + '/web#action=website.action_website_configuration');
                                publicWidget.registry.PortalGoogleAddressForm.isScriptLoading = false;
                                return;
                            } else {
                                var key_param = '&key=' + data_json.google_maps_api_key;
                                var google_script = document.createElement('script');
                                google_script.type = 'text/javascript';
                                google_script.async = true;
                                google_script.src = 'https://maps.googleapis.com/maps/api/js?v=quarterly&libraries=places&callback=portal_google_address_form' + key_param;
                                document.head.append(google_script);
                            }
                        })
                    );
                }
                return $.when.apply($, defs).then(this._attachGoogleAutocomplete.bind(this));
            }
            return $.when.apply($, defs).then(this._attachGoogleAutocomplete.bind(this));
        },
        _attachGoogleAutocomplete: function () {
            var self = this;
            setTimeout(function () {
                if (typeof google !== 'object' || typeof window.google !== 'object') return;
                var $inputField = self.$el.find(self.streetFillInputs.street.selector);
                if ($inputField.length) {
                    self.$inputAutocomplete = $inputField;
                    self._rpc({
                        route: '/gplaces/country_restrictions',
                    }).then(function (country_restrictions) {
                        self.initializeGoogleAutocomplete(
                            $inputField,
                            country_restrictions,
                            {}
                        );
                    });
                }
            }, 1000);
        },
        onPlaceChanged: function (place) {
            var self = this;
            if (place && place.hasOwnProperty('address_components')) {
                var address = self.populateAddress(place, this.streetFillInputs);
                var requests = [];

                _.each(self.streetFillInputs, function (value, key) {
                    requests.push(self.prepareValue(key, address));
                });

                Promise.all(requests).then(function (values) {
                    _.each(values, function (vals) {
                        _.each(vals, function (value, key) {
                            if (key === 'country_id') {
                                self.$el.find(self.streetFillInputs[key].selector).val(value).change();
                            } else if (key === 'state_id') {
                                // delay 1000ms
                                // waiting the states finished loaded before set a value to state_id
                                setTimeout(function () {
                                    self.$el.find(self.streetFillInputs[key].selector).val(value);
                                }, 1000);
                            } else {
                                self.$el.find(self.streetFillInputs[key].selector).val(value);
                            }
                        });
                    });
                });
                setTimeout(function () {
                    self.$inputAutocomplete.val(place.name);
                }, 300);
            }
        },
        prepareValue: function (input, value) {
            var def = $.Deferred();
            var res = {};
            if (['country_id', 'state_id'].indexOf(input) !== -1) {
                if (input === 'country_id') {
                    ajax.jsonRpc('/my/account/get_country', 'call', {
                        'country': value[input]
                    }).then(function (country_id) {
                        res[input] = country_id ? country_id.toString() : '';
                        def.resolve(res);
                    });
                }
                if (input === 'state_id') {
                    ajax.jsonRpc('/my/account/get_country_state', 'call', {
                        'state': value[input],
                        'country': value['country_id']
                    }).then(function (state_id) {
                        res[input] = state_id ? state_id.toString() : '';
                        def.resolve(res);
                    });
                }
            } else {
                res[input] = value[input];
                def.resolve(res);
            }
            return def.promise();
        },
    });

    publicWidget.registry.PortalGoogleAddressForm.prototype.isScriptLoading = false;

    return {
        googleScriptLoaded: googleScriptLoaded,
    };
});
