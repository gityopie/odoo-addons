# -*- coding: utf-8 -*-
{
    'name': 'Website Google Library Loader',
    'version': '13.0.1.0.0',
    'author': 'Yopi Angi',
    'license': 'AGPL-3',
    'maintainer': 'Yopi Angi<yopiangi@gmail.com>',
    'support': 'yopiangi@gmail.com',
    'category': 'Hidden',
    'description': """
Website Google Library Loader
=============================
This module aim to fix the issue when module web_google_maps installed
and website Google Analytic is enabled
""",
    'depends': ['web_google_maps', 'website'],
    'sequence': 1000,
    'website': '',
    'data': ['views/template.xml'],
    'installable': True,
    'application': False,
    'auto_install': False,
}
