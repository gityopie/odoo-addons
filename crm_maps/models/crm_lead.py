# -*- coding: utf-8 -*-
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl).
from odoo import api, fields, models
from odoo.addons.base_geolocalize.models.res_partner import (
    geo_find, geo_query_address)


class CrmLead(models.Model):
    _inherit = 'crm.lead'

    customer_longitude = fields.Float(
        string='Customer Latitude',
        digits=(16, 5))
    customer_latitude = fields.Float(
        string='Customer Latitude',
        digits=(16, 5))

    @api.onchange('partner_id')
    def onchange_partner_id_geo(self):
        if self.partner_id:
            self.customer_latitude = self.partner_id.partner_latitude
            self.customer_longitude = self.partner_id.partner_longitude

    @api.multi
    def geo_localize(self):
        for lead in self.with_context(lang='en_US'):
            result = geo_find(geo_query_address(
                street=lead.street,
                zip=lead.zip,
                city=lead.city,
                state=lead.state_id.name,
                country=lead.country_id.name
            ))

            if result is None:
                result = geo_find(geo_query_address(
                    city=lead.city,
                    state=lead.state_id.name,
                    country=lead.country_id.name
                ))

            if result:
                lead.write({
                    'customer_latitude': result[0],
                    'customer_longitude': result[1]
                })
        return True
