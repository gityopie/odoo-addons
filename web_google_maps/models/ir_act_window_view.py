# -*- coding: utf-8 -*-
# License AGPL-3
from odoo import fields, models


class IrActionsActWindowView(models.Model):
    _inherit = 'ir.actions.act_window.view'

    view_mode = fields.Selection(
        selection_add=[('google_map', 'Google Maps')],
        ondelete={'google_map': 'cascade'},
    )
