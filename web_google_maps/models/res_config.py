# -*- coding: utf-8 -*-
from openerp import api, fields, models


class ResConfig(models.TransientModel):
    _inherit = 'website.config.settings'

    google_maps_api_key = fields.Char(string='Google Maps API Key')

    @api.multi
    def set_google_maps_api_key(self):
        self.ensure_one()
        config_param_obj = self.env['ir.config_parameter']
        config_param_obj.set_param(
            'google_maps_api_key', (self.google_maps_api_key or '').strip(),
            groups=['base.group_system'])

    @api.model
    def get_default_google_maps_api_key(self, fields):
        config_param_obj = self.env['ir.config_parameter']
        google_maps_api_key = config_param_obj.get_param(
            'google_maps_api_key', default='')

        return dict(google_maps_api_key=google_maps_api_key)
