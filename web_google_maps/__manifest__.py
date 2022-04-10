# -*- coding: utf-8 -*-
{
    'name': 'Web Google Maps',
    'version': '15.0.1.0.1',
    'author': 'Yopi Angi',
    'license': 'AGPL-3',
    'maintainer': 'Yopi Angi<yopiangi@gmail.com>',
    'support': 'yopiangi@gmail.com',
    'category': 'Extra Tools',
    'description': """
Web Google Map and google places autocomplete address form
==========================================================

This module brings two features:
1. Allows user to view all partners addresses on google maps.
2. Enabled google places autocomplete address form into partner
form view, provide autocomplete feature when typing address of partner
""",
    'depends': ['base_setup', 'base_geolocalize'],
    'website': '',
    'data': [
        'data/google_maps_libraries.xml',
        'views/google_places_template.xml',
        'views/res_partner.xml',
        'views/res_config_settings.xml',
    ],
    'demo': [],
    'images': ['static/description/thumbnails.png'],
    'assets': {
        'web.assets_qweb': [
            '/web_google_maps/static/src/xml/view_google_map.xml'
        ],
        'web.assets_backend': [
            '/web_google_maps/static/src/scss/view_google_map.scss',
            '/web_google_maps/static/src/scss/view_google_map_mobile.scss',
            '/web_google_maps/static/src/js/view/google_map/google_map_sidebar.js',
            '/web_google_maps/static/src/js/view/google_map/google_map_model.js',
            '/web_google_maps/static/src/js/view/google_map/google_map_controller.js',
            '/web_google_maps/static/src/js/view/google_map/google_map_renderer.js',
            '/web_google_maps/static/src/js/view/google_map/google_map_view.js',
            '/web_google_maps/static/src/js/view/view_registry.js',
            '/web_google_maps/static/src/js/view/form/form_controller.js',
            '/web_google_maps/static/src/js/view/form/form_view.js',
            '/web_google_maps/static/src/js/fields/relational_fields.js',
            '/web_google_maps/static/src/js/widgets/utils.js',
            '/web_google_maps/static/src/js/widgets/gplaces_autocomplete.js',
            '/web_google_maps/static/src/js/widgets/fields_registry.js',
        ],
    },
    'installable': True,
    'application': False,
    'auto_install': False,
    'uninstall_hook': 'uninstall_hook',
}
