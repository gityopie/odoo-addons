# -*- coding: utf-8 -*-
{
    'name': 'CRM Maps',
    'version': '10.0.1.0.3',
    'author': 'Yopi Angi',
    'license': 'AGPL-3',
    'maintainer': 'yopiangi@gmail.com',
    'category': 'CRM',
    'description': """
CRM Maps
========

Show your leads and pipelines on map view
""",
    'depends': [
        'crm',
        'sales_team',
        'web_google_maps'
    ],
    'data': [
        'views/res_partner.xml',
        'views/crm_lead.xml'
    ],
    'qweb': ['static/src/xml/dashboard.xml'],
    'demo': [],
    'installable': True,
    'uninstall_hook': 'uninstall_hook',
}
