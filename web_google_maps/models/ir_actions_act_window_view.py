# -*- coding: utf-8 -*-
# License AGPL-3
from odoo import fields, models, _


class IrActionsActWindowView(models.Model):
    _inherit = 'ir.actions.act_window.view'

    view_mode = fields.Selection(selection_add=[('map', _('Map'))])
