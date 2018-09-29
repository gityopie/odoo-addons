# -*- coding: utf-8 -*-
# License AGPL-3
from odoo import http


class Main(http.Controller):

    @http.route('/web/map_theme', type='json', auth='user')
    def map_theme(self):
        ir_config_obj = http.request.env['ir.config_parameter'].sudo()
        theme = ir_config_obj.get_param('google.maps_theme', default='default')
        vals = {'theme': theme}
        return vals
