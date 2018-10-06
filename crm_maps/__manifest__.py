# -*- coding: utf-8 -*-
{
    'name': 'CRM Maps',
    'version': '12.0.1.0.0',
    'author': 'Yopi Angi',
    'license': 'AGPL-3',
    'maintainer': 'Yopi Angi<yopiangi@gmail.com>',
    'support': 'yopiangi@gmail.com',
    'category': 'Sales',
    'description': """
CRM Maps
========

Show your leads and pipelines on map view
""",
    'depends': [
        'crm',
        'web_google_maps'
    ],
    'data': [
        'views/res_partner.xml',
        'views/crm_lead.xml'
    ],
    'demo': [],
    'installable': True,
    'uninstall_hook': 'uninstall_hook',
}
