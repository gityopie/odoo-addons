# -*- coding: utf-8 -*-
# License AGPL-3
from odoo import fields, models, _


class IrActionsActWindow(models.Model):
    _inherit = 'ir.actions.act_window'

    view_type = fields.Selection(selection_add=[('map', _('Map'))])
