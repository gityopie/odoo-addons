# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request


class Main(http.Controller):

    @http.route('/web/map_theme', type='json', auth='user')
    def map_theme(self):
        theme = request.env['ir.config_parameter'].sudo().get_param(
            'web_google_maps.theme', default='default')
        res = {'theme': theme}
        return res
