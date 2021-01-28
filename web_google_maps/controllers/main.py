# -*- coding: utf-8 -*-
from odoo import http
from odoo.tools import safe_eval


class Main(http.Controller):

    @http.route('/web/google_map_theme', type='json', auth='user')
    def map_theme(self):
        ICP = http.request.env['ir.config_parameter'].sudo()
        theme = ICP.get_param('web_google_maps.map_theme', default='default')
        res = {'theme': theme}
        return res

    @http.route('/web/google_autocomplete_conf', type='json', auth='user')
    def google_autocomplete_settings(self):
        get_param = http.request.env['ir.config_parameter'].sudo().get_param
        is_lang_restrict = safe_eval(get_param(
            'web_google_maps.autocomplete_lang_restrict', default='False'))
        lang = get_param(
            'web_google_maps.localization_lang', default=False)

        result = {}
        if is_lang_restrict and lang:
            result['language'] = lang

        return result
