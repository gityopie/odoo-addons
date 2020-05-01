# -*- coding: utf-8 -*-
{
    'name': 'Contacts Google Places Autocomplete Extended',
    'version': '12.0.1.0.0',
    'author': 'Yopi Angi',
    'license': 'AGPL-3',
    'maintainer': 'Yopi Angi<yopiangi@gmail.com>',
    'support': 'yopiangi@gmail.com',
    'category': 'Base',
    'sequence': 1000,
    'description': """
Contact Google Places Autocomplete Extended
===========================================

Use Google Places autocomplete to help you find a place
""",
    'depends': [
        'base_address_extended',
        'contacts_google_places_autocomplete',
    ],
    'website': 'https://github.com/gityopie/odoo-addons',
    'data': [
        'views/res_partner.xml'
    ],
    'demo': [],
    'installable': True
}
