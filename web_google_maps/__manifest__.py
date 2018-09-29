# -*- coding: utf-8 -*-
# License AGPL-3
{
    'name': 'Web Google Maps',
    'version': '10.0.1.0.6',
    'author': 'Yopi Angi',
    'license': 'AGPL-3',
    'maintainer': 'yopiangi@gmail.com',
    'category': 'Web',
    'description': """
Web Google Map and google places autocomplete address form
==========================================================

This module brings three features:
1. A new view 'map'
2. Enabled google places autocomplete address form
For example, on customer form view, the widget provide autocomplete feature
when typing address of partner
3. Routes information
""",
    'depends': ['base_geolocalize', 'base_setup'],
    'website': '',
    'data': [
        'views/google_places_template.xml',
        'views/res_partner.xml',
        'views/res_config.xml'
    ],
    'demo': [],
    'qweb': ['static/src/xml/widget_places.xml'],
    'images': ['static/description/thumbnails.png'],
    'installable': True,
    'uninstall_hook': 'uninstall_hook',
}
