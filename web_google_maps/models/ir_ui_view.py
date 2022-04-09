# -*- coding: utf-8 -*-
# License AGPL-3
from odoo import fields, models
from odoo.tools.view_validation import get_dict_asts
from odoo.addons.base.models.ir_ui_view import transfer_field_to_modifiers


class IrUiView(models.Model):
    _inherit = 'ir.ui.view'

    type = fields.Selection(selection_add=[('google_map', 'Google Maps')])

    # FIXME: this is a deep copy of the original method
    # added 'google_map' as the list of the built-in views to be validated are hardcoded :/
    def _postprocess_tag_field(self, node, name_manager, node_info):
        if node.get('name'):
            attrs = {'id': node.get('id'), 'select': node.get('select')}
            field = name_manager.Model._fields.get(node.get('name'))
            if field:
                # apply groups (no tested)
                if field.groups and not self.user_has_groups(
                    groups=field.groups
                ):
                    node.getparent().remove(node)
                    # no point processing view-level ``groups`` anymore, return
                    return
                node_info['editable'] = (
                    node_info['editable']
                    and field.is_editable()
                    and (
                        node.get('readonly') not in ('1', 'True')
                        or get_dict_asts(node.get('attrs') or "{}")
                    )
                )
                if name_manager.validate:
                    name_manager.must_have_fields(
                        self._get_field_domain_variables(
                            node, field, node_info['editable']
                        )
                    )
                views = {}
                for child in node:
                    if child.tag in (
                        'form',
                        'tree',
                        'graph',
                        'kanban',
                        'calendar',
                        'google_map',
                    ):
                        node.remove(child)
                        xarch, sub_name_manager = self.with_context(
                            base_model_name=name_manager.Model._name,
                        )._postprocess_view(
                            child,
                            field.comodel_name,
                            name_manager.validate,
                            editable=node_info['editable'],
                        )
                        name_manager.must_have_fields(
                            sub_name_manager.mandatory_parent_fields
                        )
                        views[child.tag] = {
                            'arch': xarch,
                            'fields': sub_name_manager.available_fields,
                        }
                attrs['views'] = views
                if field.comodel_name in self.env:
                    Comodel = self.env[field.comodel_name].sudo(False)
                    node_info['attr_model'] = Comodel
                    if field.type in ('many2one', 'many2many'):
                        can_create = Comodel.check_access_rights(
                            'create', raise_exception=False
                        )
                        can_write = Comodel.check_access_rights(
                            'write', raise_exception=False
                        )
                        node.set(
                            'can_create', 'true' if can_create else 'false'
                        )
                        node.set('can_write', 'true' if can_write else 'false')

            name_manager.has_field(node.get('name'), attrs)
            field = name_manager.fields_get.get(node.get('name'))
            if field:
                transfer_field_to_modifiers(field, node_info['modifiers'])
