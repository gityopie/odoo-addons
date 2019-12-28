# -*- coding: utf-8 -*-
def migrate(cr, version):
    cr.execute("""
    UPDATE ir_config_parameter SET key = 'web_google_maps.maps_libraries' WHERE key = 'google.maps_libraries';
    """)
    cr.execute("""
    UPDATE ir_config_parameter SET key = 'web_google_maps.map_theme' WHERE key = 'google.maps_theme';
    """)
    cr.execute("""
    UPDATE ir_config_parameter SET key = 'web_google_maps.localization_lang' WHERE key = 'google.lang_localization';
    """)
    cr.execute("""
    UPDATE ir_config_parameter SET key = 'web_google_maps.localization_region' WHERE key = 'google.region_localization';
    """)
