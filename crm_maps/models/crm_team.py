# -*- coding: utf-8 -*-
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl).
from odoo import api, fields, models


class CrmTeam(models.Model):
    _inherit = 'crm.team'

    @api.model
    def action_your_pipeline(self):
        res = super(CrmTeam, self).action_your_pipeline()
        if res.get('views'):
            res['views'].append([False, 'map'])
        return res
