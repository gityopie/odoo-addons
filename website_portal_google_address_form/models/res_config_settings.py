# -*- coding: utf-8 -*-
# License AGPL-3
from odoo import fields, models
from odoo.tools.safe_eval import safe_eval


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    google_maps_country_restriction = fields.Many2many(
        'res.country', string='Country Restriction'
    )

    def set_values(self):
        super(ResConfigSettings, self).set_values()
        ICPSudo = self.env['ir.config_parameter'].sudo()
        country_restriction = self._set_google_maps_country_restriction()
        ICPSudo.set_param(
            'web_google_maps.country_restriction', country_restriction
        )

    def get_values(self):
        res = super(ResConfigSettings, self).get_values()
        country_restriction = self._get_google_maps_country_restriction()
        res['google_maps_country_restriction'] = country_restriction
        return res

    def _set_google_maps_country_restriction(self):
        countries = [
            (country.id, country.code)
            for country in self.google_maps_country_restriction
        ]
        return countries

    def _get_google_maps_country_restriction(self):
        ICPSudo = self.env['ir.config_parameter'].sudo()
        countries = ICPSudo.get_param(
            'web_google_maps.country_restriction', default='[]'
        )
        list_countries = safe_eval(countries)
        if list_countries:
            values = [country[0] for country in list_countries]
            return [(6, 0, values)]

        return [(5, 0, 0)]
