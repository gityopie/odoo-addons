# -*- coding: utf-8 -*-
{
    'name': 'Google Marker Icon Picker',
    'version': '12.0.1.0.2',
    'author': 'Yopi Angi',
    'license': 'AGPL-3',
    'maintainer': 'Yopi Angi<yopiangi@gmail.com>',
    'support': 'yopiangi@gmail.com',
    'category': 'Extra Tools',
    'description': """
Google Marker Icon Picker
=========================
- New widget `google_marker_picker` allowing user to set marker's color from field
Loaded with 20 different marker's color
To apply the selecter marker on map, you can tell map view by adding attribute color='[field_name]'
""",
    'depends': ['web_google_maps', ],
    'website': '',
    'data': [
        'views/template.xml',
    ],
    'qweb': ['static/src/xml/marker_color.xml'],
    'demo': [],
    'installable': True
}
