# -*- coding: utf-8 -*-
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl).
from odoo import fields, models


GMAPS_LANG_LOCALIZATION = [
    ('ar', 'Arabic'),
    ('bg', 'Bulgarian'),
    ('bn', 'Bengali'),
    ('ca', 'Catalan'),
    ('cs', 'Czech'),
    ('da', 'Danish'),
    ('de', 'German'),
    ('el', 'Greek'),
    ('en', 'English'),
    ('en-AU', 'English (Australian)'),
    ('en-GB', 'English (Great Britain)'),
    ('es', 'Spanish'),
    ('eu', 'Basque'),
    ('eu', 'Basque'),
    ('fa', 'Farsi'),
    ('fi', 'Finnish'),
    ('fil', 'Filipino'),
    ('fr', 'French'),
    ('gl', 'Galician'),
    ('gu', 'Gujarati'),
    ('hi', 'Hindi'),
    ('hr', 'Croatian'),
    ('hu', 'Hungarian'),
    ('id', 'Indonesian'),
    ('it', 'Italian'),
    ('iw', 'Hebrew'),
    ('ja', 'Japanese'),
    ('kn', 'Kannada'),
    ('ko', 'Korean'),
    ('lt', 'Lithuanian'),
    ('lv', 'Latvian'),
    ('ml', 'Malayalam'),
    ('mr', 'Marathi'),
    ('nl', 'Dutch'),
    ('no', 'Norwegian'),
    ('pl', 'Polish'),
    ('pt', 'Portuguese'),
    ('pt-BR', 'Portuguese (Brazil)'),
    ('pt-PT', 'Portuguese (Portugal)'),
    ('ro', 'Romanian'),
    ('ru', 'Russian'),
    ('sk', 'Slovak'),
    ('sl', 'Slovenian'),
    ('sr', 'Serbian'),
    ('sv', 'Swedish'),
    ('ta', 'Tamil'),
    ('te', 'Telugu'),
    ('th', 'Thai'),
    ('tl', 'Tagalog'),
    ('tr', 'Turkish'),
    ('uk', 'Ukrainian'),
    ('vi', 'Vietnamese'),
    ('zh-CN', 'Chinese (Simplified)'),
    ('zh-TW', 'Chinese (Traditional)'),
]


class WebsiteConfigSettings(models.TransientModel):
    _inherit = 'website.config.settings'

    def get_region_selection(self):
        country_ids = self.env['res.country'].search([])
        values = [(country.code, country.name) for country in country_ids]
        return values

    google_maps_lang_localization = fields.Selection(
        selection=GMAPS_LANG_LOCALIZATION,
        string='Google Maps Language Localization')
    google_maps_region_localization = fields.Selection(
        selection=get_region_selection,
        string='Google Maps Region Localization')
    google_maps_theme = fields.Selection(
        selection=[
            ('default', 'Default'),
            ('aubergine', 'Aubergine'),
            ('night', 'Night'),
            ('dark', 'Dark'),
            ('retro', 'Retro'),
            ('silver', 'Silver')],
        default='default',
        string='Map theme'
    )

    def set_google_maps_lang_localization(self):
        ir_config_obj = self.env['ir.config_parameter']
        if self.google_maps_lang_localization:
            lang_localization = '&language=%s' % \
                self.google_maps_lang_localization
        else:
            lang_localization = ''
        ir_config_obj.set_param('google_maps_lang_localization',
                                lang_localization,
                                groups=['base.group_system'])

    def get_default_google_maps_lang_localization(self, fields):
        ir_config_obj = self.env['ir.config_parameter']
        google_maps_lang = ir_config_obj.get_param(
            'google_maps_lang_localization', default='')
        val = google_maps_lang.split('=')
        if val:
            lang = val[-1]
        else:
            lang = ''
        return dict(google_maps_lang_localization=lang)

    def set_google_maps_region_localization(self):
        ir_config_obj = self.env['ir.config_parameter']
        if self.google_maps_region_localization:
            region_localization = '&region=%s' % \
                self.google_maps_region_localization
        else:
            region_localization = ''

        ir_config_obj.set_param('google_maps_region_localization',
                                region_localization,
                                groups=['base.group_system'])

    def get_default_google_maps_region_localization(self, fields):
        ir_config_obj = self.env['ir.config_parameter']
        google_maps_region = ir_config_obj.get_param(
            'google_maps_region_localization', default='')
        val = google_maps_region.split('=')
        if val:
            region = val[-1]
        else:
            region = ''
        return dict(google_maps_region_localization=region)

    def set_google_maps_theme(self):
        ir_config_obj = self.env['ir.config_parameter']
        theme = self.google_maps_theme or 'default'
        ir_config_obj.set_param('google_maps_theme',
                                theme,
                                groups=['base.group_system'])

    def get_default_google_maps_theme(self, fields):
        ir_config_obj = self.env['ir.config_parameter']
        theme = ir_config_obj.get_param('google_maps_theme', default='default')
        return dict(google_maps_theme=theme)
