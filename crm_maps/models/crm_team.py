# -*- coding: utf-8 -*-
# License AGPL-3
from odoo import api, fields, models


class CrmTeam(models.Model):
    _inherit = 'crm.team'

    @api.model
    def action_your_pipeline(self):
        res = super(CrmTeam, self).action_your_pipeline()
        if res.get('views'):
            res['views'].append([False, 'map'])
        return res
