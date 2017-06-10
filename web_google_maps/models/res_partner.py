# -*- coding: utf-8 -*-
from odoo import api, exceptions, models, _


class ResPartner(models.Model):
    _inherit = 'res.partner'

    @api.multi
    def action_map_route(self):
        self.ensure_one()
        context = self.env.context.copy()
        user_id = self.env.user.partner_id
        if not all([user_id.partner_longitude, user_id.partner_latitude]):
            raise exceptions.Warning(_(
                'You have not defined your geolocation'))
        context.update({
            'origin_latitude': user_id.partner_latitude,
            'origin_longitude': user_id.partner_longitude,
            'destination_latitude': self.partner_latitude,
            'destination_longitude': self.partner_longitude
        })
        partners = [user_id.id, self.id]
        view_map_id = self.env.ref('web_google_maps.view_partner_map')
        return {
            'name': _('Map'),
            'type': 'ir.actions.act_window',
            'res_model': 'res.partner',
            'view_mode': 'map',
            'view_type': 'map',
            'views': [(view_map_id.id, 'map')],
            'context': context,
            'domain': [('id', 'in', partners)]
        }
