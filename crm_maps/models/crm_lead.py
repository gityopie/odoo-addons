from odoo import api, fields, models


class CrmLead(models.Model):
    _inherit = 'crm.lead'

    customer_longitude = fields.Float(
        string='Customer Longitude', digits=(16, 5)
    )
    customer_latitude = fields.Float(
        string='Customer Latitude', digits=(16, 5)
    )

    @api.onchange('partner_id')
    def onchange_partner_id_geo(self):
        if self.partner_id:
            self.customer_latitude = self.partner_id.partner_latitude
            self.customer_longitude = self.partner_id.partner_longitude

    @api.model
    def _geo_localize(self, street='', zip='', city='', state='', country=''):
        geo_obj = self.env['base.geocoder']
        search = geo_obj.geo_query_address(
            street=street, zip=zip, city=city, state=state, country=country
        )
        result = geo_obj.geo_find(search, force_country=country)
        if result is None:
            search = geo_obj.geo_query_address(
                city=city, state=state, country=country
            )
            result = geo_obj.geo_find(search, force_country=country)
        return result

    def geo_localize(self):
        for lead in self.with_context(lang='en_US'):
            result = self._geo_localize(
                street=lead.street,
                zip=lead.zip,
                city=lead.city,
                state=lead.state_id.name,
                country=lead.country_id.name,
            )

            if result:
                lead.write(
                    {
                        'customer_latitude': result[0],
                        'customer_longitude': result[1],
                    }
                )

        return True
