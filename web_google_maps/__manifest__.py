# -*- coding: utf-8 -*-
{
    'name': 'Web Google Maps',
    'version': '1.1',
    'author': "Yopi Angi",
    'maintainer': 'Yopi Angi<yopiangi@gmail.com>',
    'category': 'web',
    'description': """
Web Google Map and google places autocomplete address form
==========================================================

This module brings three features:
1. Allows user to view all partners addresses on google maps.
2. Enabled google places autocomplete address form into partner
form view, it provide autocomplete feature when you typed an address of partner
3. Routes information
""",
    'depends': [
        'website_google_map'
    ],
    'website': '',
    'data': [
        'views/google_places_template.xml',
        'views/res_partner.xml',
    ],
    'demo': [],
    'qweb': ['static/src/xml/widget_places.xml'],
    'installable': True
}
