# -*- coding: utf-8 -*-
# License AGPL-3
from odoo import api, fields, models

GMAPS_LANG_LOCALIZATION = [
    ('af', 'Afrikaans'),
    ('ja', 'Japanese'),
    ('sq', 'Albanian'),
    ('kn', 'Kannada'),
    ('am', 'Amharic'),
    ('kk', 'Kazakh'),
    ('ar', 'Arabic'),
    ('km', 'Khmer'),
    ('ar', 'Armenian'),
    ('ko', 'Korean'),
    ('az', 'Azerbaijani'),
    ('ky', 'Kyrgyz'),
    ('eu', 'Basque'),
    ('lo', 'Lao'),
    ('be', 'Belarusian'),
    ('lv', 'Latvian'),
    ('bn', 'Bengali'),
    ('lt', 'Lithuanian'),
    ('bs', 'Bosnian'),
    ('mk', 'Macedonian'),
    ('bg', 'Bulgarian'),
    ('ms', 'Malay'),
    ('my', 'Burmese'),
    ('ml', 'Malayalam'),
    ('ca', 'Catalan'),
    ('mr', 'Marathi'),
    ('zh', 'Chinese'),
    ('mn', 'Mongolian'),
    ('zh-CN', 'Chinese (Simplified)'),
    ('ne', 'Nepali'),
    ('zh-HK', 'Chinese (Hong Kong)'),
    ('no', 'Norwegian'),
    ('zh-TW', 'Chinese (Traditional)'),
    ('pl', 'Polish'),
    ('hr', 'Croatian'),
    ('pt', 'Portuguese'),
    ('cs', 'Czech'),
    ('pt-BR', 'Portuguese (Brazil)'),
    ('da', 'Danish'),
    ('pt-PT', 'Portuguese (Portugal)'),
    ('nl', 'Dutch'),
    ('pa', 'Punjabi'),
    ('en', 'English'),
    ('ro', 'Romanian'),
    ('en-AU', 'English (Australian)'),
    ('ru', 'Russian'),
    ('en-GB', 'English (Great Britain)'),
    ('sr', 'Serbian'),
    ('et', 'Estonian'),
    ('si', 'Sinhalese'),
    ('fa', 'Farsi'),
    ('sk', 'Slovak'),
    ('fi', 'Finnish'),
    ('sl', 'Slovenian'),
    ('fil', 'Filipino'),
    ('es', 'Spanish'),
    ('fr', 'French'),
    ('es-419', 'Spanish (Latin America)'),
    ('fr-CA', 'French (Canada)'),
    ('sw', 'Swahili'),
    ('gl', 'Galician'),
    ('sv', 'Swedish'),
    ('ka', 'Georgian'),
    ('ta', 'Tamil'),
    ('de', 'German'),
    ('te', 'Telugu'),
    ('el', 'Greek'),
    ('th', 'Thai'),
    ('gu', 'Gujarati'),
    ('tr', 'Turkish'),
    ('iw', 'Hebrew'),
    ('uk', 'Ukrainian'),
    ('hi', 'Hindi'),
    ('ur', 'Urdu'),
    ('hu', 'Hungarian'),
    ('uz', 'Uzbek'),
    ('is', 'Icelandic'),
    ('vi', 'Vietnamese'),
    ('id', 'Indonesian'),
    ('zu', 'Zulu'),
    ('it', 'Italian'),
]


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    @api.model
    def get_region_selection(self):
        country_ids = self.env['res.country'].search([])
        values = [(country.code, country.name) for country in country_ids]
        return values

    google_maps_view_api_key = fields.Char(
        string='Google Maps View Api Key',
        config_parameter='google.api_key_geocode')
    google_maps_lang_localization = fields.Selection(
        selection=GMAPS_LANG_LOCALIZATION,
        string='Google Maps Language Localization',
        config_parameter='web_google_maps.localization_lang')
    google_maps_region_localization = fields.Selection(
        selection=get_region_selection,
        string='Google Maps Region Localization',
        config_parameter='web_google_maps.localization_region')
    google_maps_theme = fields.Selection(
        selection=[('default', 'Default'),
                   ('aubergine', 'Aubergine'),
                   ('night', 'Night'),
                   ('dark', 'Dark'),
                   ('retro', 'Retro'),
                   ('silver', 'Silver')],
        string='Map theme',
        config_parameter='web_google_maps.map_theme')
    google_autocomplete_lang_restrict = fields.Boolean(
        string='Google Autocomplete Language Restriction',
        config_parameter='web_google_maps.autocomplete_lang_restrict')
    google_maps_lib_places = fields.Boolean(string='Places', default=True)
    google_maps_lib_geometry = fields.Boolean(string='Geometry', default=True)
    google_maps_lib_drawing = fields.Boolean(string='Drawing')
    google_maps_lib_visualization = fields.Boolean(string='Visualization')

    @api.onchange('google_maps_lang_localization')
    def onchange_lang_localization(self):
        if not self.google_maps_lang_localization:
            self.google_maps_region_localization = ''
            self.google_autocomplete_lang_restrict = False

    @api.multi
    def set_values(self):
        super(ResConfigSettings, self).set_values()
        ICPSudo = self.env['ir.config_parameter'].sudo()

        lib_places = self._set_google_maps_places()
        lib_geometry = self._set_google_maps_geometry()
        lib_drawing = self._set_google_maps_drawing()
        lib_visualize = self._set_google_maps_visualization()

        active_libraries = ','.join(
            filter(None, [lib_places, lib_geometry, lib_drawing, lib_visualize]))

        ICPSudo.set_param('web_google_maps.maps_libraries', active_libraries)

    @api.model
    def get_values(self):
        res = super(ResConfigSettings, self).get_values()

        lib_places = self._get_google_maps_places()
        lib_geometry = self._get_google_maps_geometry()
        lib_drawing = self._get_google_maps_drawing()
        lib_visualize = self._get_google_maps_visualization()

        res.update({
            'google_maps_lib_places': lib_places,
            'google_maps_lib_geometry': lib_geometry,
            'google_maps_lib_drawing': lib_drawing,
            'google_maps_lib_visualization': lib_visualize
        })
        return res

    @api.model
    def _get_google_maps_geometry(self):
        ICPSudo = self.env['ir.config_parameter'].sudo()
        google_maps_libraries = ICPSudo.get_param(
            'web_google_maps.maps_libraries', default='')
        libraries = google_maps_libraries.split(',')
        return 'geometry' in libraries

    @api.multi
    def _set_google_maps_geometry(self):
        return 'geometry' if self.google_maps_lib_geometry else False

    @api.model
    def _get_google_maps_places(self):
        ICPSudo = self.env['ir.config_parameter'].sudo()
        google_maps_libraries = ICPSudo.get_param(
            'web_google_maps.maps_libraries', default='')
        libraries = google_maps_libraries.split(',')
        return 'places' in libraries

    @api.multi
    def _set_google_maps_places(self):
        return 'places' if self.google_maps_lib_places else False

    @api.model
    def _get_google_maps_drawing(self):
        ICPSudo = self.env['ir.config_parameter'].sudo()
        google_maps_libraries = ICPSudo.get_param(
            'web_google_maps.maps_libraries', default='')
        libraries = google_maps_libraries.split(',')
        return 'drawing' in libraries

    @api.multi
    def _set_google_maps_drawing(self):
        return 'drawing' if self.google_maps_lib_drawing else False

    @api.model
    def _get_google_maps_visualization(self):
        ICPSudo = self.env['ir.config_parameter'].sudo()
        google_maps_libraries = ICPSudo.get_param(
            'web_google_maps.maps_libraries', default='')
        libraries = google_maps_libraries.split(',')
        return 'visualization' in libraries

    @api.multi
    def _set_google_maps_visualization(self):
        return 'visualization' if self.google_maps_lib_visualization else False
