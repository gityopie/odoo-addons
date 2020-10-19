# -*- coding: utf-8 -*-
from odoo import fields, models


class ResPartner(models.Model):
    _inherit = 'res.partner'

    marker_color = fields.Char(
        string='Marker Color', default='red', required=True)
