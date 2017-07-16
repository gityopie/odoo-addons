# -*- coding: utf-8 -*-
from openerp import fields, models


class IrActionsActWindow(models.Model):
    _inherit = 'ir.actions.act_window'

    view_type = fields.Selection(selection_add=(('map', 'Map'), ))
