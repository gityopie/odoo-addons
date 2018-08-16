# -*- coding: utf-8 -*-
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl).
{
    'name': 'Web Google Maps Drawing',
    'version': '11.0.1.0.0',
    'author': "Yopi Angi",
    'maintainer': 'Yopi Angi<yopiangi@gmail.com>',
    'category': 'Web',
    'description': """
Web Google Map and google places autocomplete address form
==========================================================

This module brings three features:
1. Allows user to view all partners addresses on google maps.
2. Enabled google places autocomplete address form into partner
form view, it provide autocomplete feature when typing address of partner
""",
    'depends': [
        'web_google_maps',
        'sale'
    ],
    'website': '',
    'data': [
        'views/template.xml',
        'views/res_config.xml',
        'views/res_partner.xml',
        'views/res_partner_area.xml'
    ],
    'qweb': ['static/src/xml/drawing.xml'],
    'installable': True
}
