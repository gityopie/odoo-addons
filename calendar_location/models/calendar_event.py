# -*- coding: utf-8 -*-
from odoo import api, fields, models


class CalendarEvent(models.Model):
    _inherit = 'calendar.event'

    @api.model
    def default_get(self, fields):
        res = super().default_get(fields)
        context = self.env.context
        if context.get('active_model') in (
            'crm.lead',
            'res.partner',
        ) and context.get('partner_id'):
            partner_id = self.env['res.partner'].browse(context['partner_id'])
            address = ''
            if partner_id.contact_address:
                address = ', '.join(
                    filter(None, partner_id.contact_address.split('\n')[1:])
                )

            res['location'] = address
            res['location_latitude'] = partner_id.partner_latitude
            res['location_longitude'] = partner_id.partner_longitude
        return res

    @api.depends('start')
    def _compute_marker_color(self):
        for rec in self:
            if rec.start < fields.Datetime.now():
                rec.marker_color = 'red'
            else:
                rec.marker_color = 'green'

    location_latitude = fields.Float('Geo Latitude', digits=(16, 5))
    location_longitude = fields.Float('Geo Longitude', digits=(16, 5))
    marker_color = fields.Char(compute='_compute_marker_color')
