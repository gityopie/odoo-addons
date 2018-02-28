# -*- coding: utf-8 -*-
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl).
{
    'name': 'Website Google Address Form',
    'version': '11.0.0.0.1',
    'author': 'Yopi Angi',
    'maintainer': 'Yopi Angi<yopiangi@gmail.com>',
    'category': 'Website',
    'depends': [
        'website_sale',
        'web_google_maps'
    ],
    'description': """
Google Address Form Autocomplete
================================

Enable Google Address form autocomplete on Website sale customer form
""",
    'demo': [],
    'data': [
        'views/template.xml',
        'views/res_config.xml'
    ],
    'installable': True
}
