# -*- coding: utf-8 -*-
{
    'name': 'Web Google Maps Drawing',
    'version': '11.0.1.0.2',
    'author': 'Yopi Angi',
    'license': 'LGPL-3.0',
    'maintainer': 'Yopi Angi',
    'support': 'yopiangi@gmail.com',
    'category': 'Web',
    'description': """
Web Google Maps Drawing
=======================

Allows users to draw polygons, rectangles, and circles on the map.
""",
    'depends': [
        'web_google_maps',
    ],
    'demo': [],
    'data': [
        'data/google_maps_library.xml',
        'views/template.xml',
        'views/res_config.xml',
    ],
    'qweb': ['static/src/xml/drawing.xml'],
    'installable': True
}
