# -*- encoding: utf-8 -*-
from odoo import api, fields, models


class ResPartnerArea(models.Model):
    _name = 'res.partner.area'
    _inherit = 'google_maps.drawing.shape.mixin'

    partner_id = fields.Many2one(
        'res.partner', required=True, ondelete='cascade')


class ResPartner(models.Model):
    _inherit = 'res.partner'


    shape_line_ids = fields.One2many(
        'res.partner.area', 'partner_id', string='Area')

