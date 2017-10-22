# -*- coding: utf-8 -*-
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl).
{
    'name': 'CRM Maps',
    'version': '0.1',
    'author': "Yopi Angi",
    'maintainer': 'Yopi Angi<yopiangi@gmail.com>',
    'category': 'web',
    'description': """
CRM Maps
========

Show your leads and pipelines on map
""",
    'depends': [
        'crm',
        'sales_team',
        'web_google_maps'
    ],
    'data': [
        'views/crm_lead.xml'
    ],
    'qweb': [
        'static/src/xml/dashboard.xml'
    ],
    'demo': [],
    'installable': True,
    'uninstall_hook': 'uninstall_hook',
}
