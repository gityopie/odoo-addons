# -*- coding: utf-8 -*-
from odoo import fields, models, _


class IrUiView(models.Model):
    _inherit = 'ir.ui.view'

    type = fields.Selection(selection_add=[('map', _('Map'))])
