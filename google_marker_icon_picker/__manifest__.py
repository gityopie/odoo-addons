# -*- coding: utf-8 -*-
{
    "name": "Google Marker Icon Picker",
    "version": "15.0.1.0.0",
    "author": "Yopi Angi",
    "license": "AGPL-3",
    "maintainer": "Yopi Angi<yopiangi@gmail.com>",
    "support": "yopiangi@gmail.com",
    "category": "Extra Tools",
    "description": """
Google Marker Icon Picker
=========================
- New widget `google_marker_picker` allowing user to assign marker's color
  manually. To apply the selecter marker on map, you can tell map view by
  adding attribute color='[field_name]'
""",
    "depends": ["web_google_maps"],
    "assets": {
        "web.assets_backend": [
            "/google_marker_icon_picker/static/src/js/view/google_map/google_map_view.js",
            "/google_marker_icon_picker/static/src/js/view/google_map/google_map_renderer.js",
            "/google_marker_icon_picker/static/src/js/widget/field_marker.js",
        ],
        "web.assets_qweb": [
            "/google_marker_icon_picker/static/src/xml/marker_color.xml"
        ],
    },
    "website": "",
    "data": [],
    "demo": [],
    "installable": True,
}
