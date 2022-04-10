# -*- coding: utf-8 -*-
# License AGPL-3
from lxml import etree
from odoo import fields, models, _
from odoo.addons.base.models.ir_ui_view import (
    quick_eval,
    transfer_field_to_modifiers,
)


class IrUiView(models.Model):
    _inherit = 'ir.ui.view'

    type = fields.Selection(selection_add=[('google_map', 'Google Maps')])

    # FIXME: this is a deep copy of the original method
    # added 'google_map' as list of original views to be validated are hardcoded :/
    def _validate_tag_field(self, node, name_manager, node_info):
        validate = node_info['validate']

        name = node.get('name')
        if not name:
            self._raise_view_error(
                _("Field tag must have a \"name\" attribute defined"), node
            )

        field = name_manager.model._fields.get(name)
        if field:
            if validate and field.relational:
                domain = (
                    node.get('domain')
                    or node_info['editable']
                    and field._description_domain(self.env)
                )
                if isinstance(domain, str):
                    # dynamic domain: in [('foo', '=', bar)], field 'foo' must
                    # exist on the comodel and field 'bar' must be in the view
                    desc = (
                        f'domain of <field name="{name}">'
                        if node.get('domain')
                        else f"domain of field '{name}'"
                    )
                    fnames, vnames = self._get_domain_identifiers(
                        node, domain, desc
                    )
                    self._check_field_paths(
                        node, fnames, field.comodel_name, f"{desc} ({domain})"
                    )
                    if vnames:
                        name_manager.must_have_fields(
                            vnames, f"{desc} ({domain})"
                        )

            elif validate and node.get('domain'):
                msg = _(
                    'Domain on non-relational field "%(name)s" makes no sense (domain:%(domain)s)',
                    name=name,
                    domain=node.get('domain'),
                )
                self._raise_view_error(msg, node)

            for child in node:
                if child.tag not in (
                    'form',
                    'tree',
                    'graph',
                    'kanban',
                    'calendar',
                    'google_map',
                ):
                    continue
                node.remove(child)
                sub_manager = self._validate_view(
                    child,
                    field.comodel_name,
                    editable=node_info['editable'],
                    full=validate,
                )
                for fname, use in sub_manager.mandatory_parent_fields.items():
                    name_manager.must_have_field(fname, use)

        elif validate and name not in name_manager.field_info:
            msg = _(
                'Field "%(field_name)s" does not exist in model "%(model_name)s"',
                field_name=name,
                model_name=name_manager.model._name,
            )
            self._raise_view_error(msg, node)

        name_manager.has_field(
            name, {'id': node.get('id'), 'select': node.get('select')}
        )

        if validate:
            for attribute in ('invisible', 'readonly', 'required'):
                val = node.get(attribute)
                if val:
                    res = quick_eval(val, {'context': self._context})
                    if res not in (1, 0, True, False, None):
                        msg = _(
                            'Attribute %(attribute)s evaluation expects a boolean, got %(value)s',
                            attribute=attribute,
                            value=val,
                        )
                        self._raise_view_error(msg, node)

    # FIXME: this is a deep copy of the original method
    # added 'google_map' as list of original views to be validated are hardcoded :/
    def _postprocess_tag_field(self, node, name_manager, node_info):
        if node.get('name'):
            attrs = {'id': node.get('id'), 'select': node.get('select')}
            field = name_manager.model._fields.get(node.get('name'))
            if field:
                # apply groups (no tested)
                if field.groups and not self.user_has_groups(
                    groups=field.groups
                ):
                    node.getparent().remove(node)
                    # no point processing view-level ``groups`` anymore, return
                    return
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
                        sub_name_manager = self.with_context(
                            base_model_name=name_manager.model._name,
                        )._postprocess_view(
                            child,
                            field.comodel_name,
                            editable=node_info['editable'],
                        )
                        xarch = etree.tostring(
                            child, encoding="unicode"
                        ).replace('\t', '')
                        views[child.tag] = {
                            'arch': xarch,
                            'fields': dict(sub_name_manager.available_fields),
                        }
                attrs['views'] = views
                if field.type in ('many2one', 'many2many'):
                    comodel = self.env[field.comodel_name].sudo(False)
                    can_create = comodel.check_access_rights(
                        'create', raise_exception=False
                    )
                    can_write = comodel.check_access_rights(
                        'write', raise_exception=False
                    )
                    node.set('can_create', 'true' if can_create else 'false')
                    node.set('can_write', 'true' if can_write else 'false')

            name_manager.has_field(node.get('name'), attrs)

            field_info = name_manager.field_info.get(node.get('name'))
            if field_info:
                transfer_field_to_modifiers(field_info, node_info['modifiers'])
