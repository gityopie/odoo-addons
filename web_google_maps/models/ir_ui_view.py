# -*- coding: utf-8 -*-
# License LGPL-3.0
from odoo import api, fields, models


class IrUiView(models.Model):
    _inherit = 'ir.ui.view'

    type = fields.Selection(selection_add=[('map', 'Map')])
