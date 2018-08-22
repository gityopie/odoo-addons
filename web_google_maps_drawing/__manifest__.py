# -*- coding: utf-8 -*-
# License LGPL-3.0
{
    'name': 'Web Google Maps Drawing',
    'version': '11.0.1.0.1',
    'author': "Yopi Angi",
    'maintainer': 'Yopi Angi<yopiangi@gmail.com>',
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
    'license': 'LGPL-3.0',
    'data': [
        'data/google_maps_library.xml',
        'views/template.xml',
        'views/res_config.xml',
    ],
    'qweb': ['static/src/xml/drawing.xml'],
    'installable': True
}
