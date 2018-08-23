# -*- coding: utf-8 -*-
{
    'name': 'CRM Maps',
    'version': '11.0.1.0.2',
    'author': 'Yopi Angi',
    'license': 'AGPL-3',
    'support': 'yopiangi@gmail.com',
    'category': 'Sales',
    'description': """
CRM Maps
========

Show your leads and pipelines on map
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
