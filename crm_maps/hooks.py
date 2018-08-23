# -*- coding: utf-8 -*-
# License AGPL-3


def uninstall_hook(cr, registry):
    query1 = """
    UPDATE ir_act_window
    SET view_mode=replace(view_mode, ',map', '')
    WHERE view_mode LIKE '%,map%' and res_model = 'crm.lead';
    """
    cr.execute(query1)

    query2 = """
    UPDATE ir_act_window
    SET view_mode=replace(view_mode, 'map,', '')
    WHERE view_mode LIKE '%map,%' and res_model = 'crm.lead';
    """
    cr.execute(query2)

    query3 = """
    DELETE FROM ir_act_window_view
    WHERE id = (
        SELECT v.id
        FROM ir_act_window_view as v
        JOIN ir_act_window as w ON v.act_window_id=w.id
        WHERE v.view_mode = 'map' and w.res_model = 'crm.lead'
    );
    """
    cr.execute(query3)
