odoo.define('web_google_maps.FieldsRegistry', function (require) {
    'use strict';

    const registry = require('web.field_registry');
    const GplacesAutocomplete = require('web_google_maps.GplaceAutocompleteFields');

    registry.add('gplaces_address_autocomplete', GplacesAutocomplete.GplacesAddressAutocompleteField);
    registry.add('gplaces_autocomplete', GplacesAutocomplete.GplacesAutocompleteField);

});