# -*- coding: utf-8 -*-
{
    'name': 'Sale Maps',
    'version': '10.0.1.0.1',
    'author': 'Yopi Angi',
    'license': 'AGPL-3',
    'maintainer': 'yopiangi@gmail.com',
    'category': 'Sale',
    'description': """
Sale Maps
=========

- Added map view on Customers    
- Added smart button 'Map' on Customer form view
""",
    'depends': ['sale', 'web_google_maps'],
    'website': '',
    'data': [
        'views/res_partner.xml',
    ],
    'demo': [],
    'installable': True
}
