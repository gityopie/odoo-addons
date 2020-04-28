odoo.define('contacts_google_address_form_extended.GplaceAutocompleteFields', function (require) {
    'use strict';

    var GplaceAutocompleteFields = require('web_google_maps.GplaceAutocompleteFields');

    GplaceAutocompleteFields.GplacesAddressAutocompleteField.include({
        setDefault: function () {
            this._super.apply(this, arguments);
            this.address_form = {
                route: 'street_name',
                route_number: 'street_number',
                street2: 'street2',
                city: 'city',
                zip: 'zip',
                state_id: 'state_id',
                country_id: 'country_id'
            };
            this.fillfields = {
                [this.address_form.route]: 'route',
                [this.address_form.route_number]: 'street_number',
                [this.address_form.street2]: ['administrative_area_level_3', 'administrative_area_level_4', 'administrative_area_level_5'],
                [this.address_form.city]: 'locality',
                [this.address_form.zip]: 'postal_code',
                [this.address_form.state_id]: 'administrative_area_level_1',
                [this.address_form.country_id]: 'country'
            };
        },
        handlePopulateAddress: function () {
            this._super.apply(this, arguments);
            var place = this.places_autocomplete.getPlace();
            if (Object.prototype.hasOwnProperty.call(place, 'address_components')) {
                var google_address = this._populateAddress(place);
                this.$input.val(google_address[this.address_form.route]);
            }
        }
    });
});