# -*- coding: utf-8 -*-
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl).


def uninstall_hook(cr, registry):
    cr.execute("UPDATE ir_act_window "
               "SET view_mode=replace(view_mode, ',map', '')"
               "WHERE view_mode LIKE '%,map%' and res_model = 'crm.lead';")
    cr.execute("UPDATE ir_act_window "
               "SET view_mode=replace(view_mode, 'map,', '')"
               "WHERE view_mode LIKE '%map,%' and res_model = 'crm.lead';")