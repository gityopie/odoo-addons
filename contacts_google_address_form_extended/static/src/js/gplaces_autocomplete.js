odoo.define('contacts_google_address_form_extended.GplaceAddressAutocomplete', function(require) {
    'use strict';

    var place_autocomplete = require('web_google_maps.GplaceAutocompleteFields');

    place_autocomplete.GplacesAddressAutocompleteField.include({
        /**
         * Override
         */
        handlePopulateAddress: function () {
            var place = this.places_autocomplete.getPlace();
            if (place.hasOwnProperty('address_components')) {
                var google_address = this._populateAddress(place);
                this.captured_input = this._getValue();
                this.populateAddress(place, google_address);
            }
        },
        _onUpdateWidgetFields: function (values) {
            if (values && values.hasOwnProperty('street_number')) {
                if (values.street_number) {
                    this.$input.val(values[this.name]);
                } else if (this.captured_input) {
                    this.$input.val(this.captured_input.split(', ')[0]);
                }
            }
            this._super(values);
        }
    })
});