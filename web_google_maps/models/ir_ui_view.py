# -*- coding: utf-8 -*-
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl).
from lxml import etree
import itertools
from operator import itemgetter

from odoo.osv import orm
from odoo import api, fields, models


class IrUiView(models.Model):
    _inherit = 'ir.ui.view'

    type = fields.Selection(selection_add=[('map', 'Map')])

    @api.model
    def postprocess(self, model, node, view_id, in_tree_view, model_fields):
        """Return the description of the fields in the node.

        In a normal call to this method, node is a complete view architecture
        but it is actually possible to give some sub-node (this is used so
        that the method can call itself recursively).

        Originally, the field descriptions are drawn from the node itself.
        But there is now some code calling fields_get() in order to merge some
        of those information in the architecture.

        """
        result = False
        fields = {}
        children = True
        view_tags = ('form', 'tree', 'graph', 'kanban', 'calendar', 'map')

        modifiers = {}
        if model not in self.env:
            self.raise_view_error(
                _('Model not found: %(model)s') % dict(model=model), view_id)
        Model = self.env[model]

        if node.tag in ('field', 'node', 'arrow'):
            if node.get('object'):
                attrs = {}
                views = {}
                xml_form = E.form(*(f for f in node if f.tag == 'field'))
                xarch, xfields = self.with_context(
                    base_model_name=model).postprocess_and_fields(
                        node.get('object'), xml_form, view_id)
                views['form'] = {
                    'arch': xarch,
                    'fields': xfields,
                }
                attrs = {'views': views}
                fields = xfields
            if node.get('name'):
                attrs = {}
                field = Model._fields.get(node.get('name'))
                if field:
                    editable = self.env.context.get(
                        'view_is_editable', True) and \
                        self._field_is_editable(field, node)
                    children = False
                    views = {}
                    for f in node:
                        if f.tag in view_tags:
                            node.remove(f)
                            xarch, xfields = self.with_context(
                                base_model_name=model,
                                view_is_editable=editable,
                            ).postprocess_and_fields(
                                field.comodel_name, f, view_id)
                            views[str(f.tag)] = {
                                'arch': xarch,
                                'fields': xfields,
                            }
                    attrs = {'views': views}
                    if field.comodel_name in self.env and \
                            field.type in ('many2one', 'many2many'):
                        Comodel = self.env[field.comodel_name]
                        node.set('can_create', 'true' if
                                 Comodel.check_access_rights(
                                     'create',
                                     raise_exception=False) else 'false')
                        node.set('can_write', 'true' if
                                 Comodel.check_access_rights(
                                     'write',
                                     raise_exception=False) else 'false')
                fields[node.get('name')] = attrs

                field = model_fields.get(node.get('name'))
                if field:
                    orm.transfer_field_to_modifiers(field, modifiers)

        elif node.tag in ('form', 'tree'):
            result = Model.view_header_get(False, node.tag)
            if result:
                node.set('string', result)
            in_tree_view = node.tag == 'tree'

        elif node.tag == 'calendar':
            for additional_field in ('date_start', 'date_delay', 'date_stop',
                                     'color', 'all_day'):
                if node.get(additional_field):
                    fields[node.get(additional_field).split('.', 1)[0]] = {}
            for f in node:
                if f.tag == 'filter':
                    fields[f.get('name')] = {}

        if not self._apply_group(model, node, modifiers, fields):
            # node must be removed, no need to proceed further 
            # with its children
            return fields

        # The view architeture overrides the python model.
        # Get the attrs before they are (possibly) deleted by check_group below
        orm.transfer_node_to_modifiers(
            node, modifiers, self._context, in_tree_view)

        for f in node:
            if children or (node.tag == 'field' and
                            f.tag in ('filter', 'separator')):
                fields.update(self.postprocess(
                    model, f, view_id, in_tree_view, model_fields))

        orm.transfer_modifiers_to_node(modifiers, node)
        return fields

    @api.model
    def postprocess_and_fields(self, model, node, view_id):
        """ Return an architecture and a description of all the fields.

        The field description combines the result of fields_get() and
        postprocess().

        :param node: the architecture as as an etree
        :return: a tuple (arch, fields) where arch is the given node as a
            string and fields is the description of all the fields.

        """
        fields = {}
        if model not in self.env:
            self.raise_view_error(
                _('Model not found: %(model)s') % dict(model=model), view_id)
        Model = self.env[model]

        is_base_model = self.env.context.get('base_model_name', model) == model

        if node.tag == 'diagram':
            if node.getchildren()[0].tag == 'node':
                node_model = self.env[node.getchildren()[0].get('object')]
                node_fields = node_model.fields_get(None)
                fields.update(node_fields)
                if (not node.get("create") and
                        not node_model.check_access_rights(
                            'create', raise_exception=False) or
                    not self._context.get("create", True) and
                        is_base_model):
                    node.set("create", 'false')
            if node.getchildren()[1].tag == 'arrow':
                arrow_fields = self.env[node.getchildren()[1].get(
                    'object')].fields_get(None)
                fields.update(arrow_fields)
        else:
            fields = Model.fields_get(None)

        node = self.add_on_change(model, node)

        attrs_fields = []
        if self.env.context.get('check_field_names'):
            editable = self.env.context.get('view_is_editable', True)
            attrs_fields = self.get_attrs_field_names(node, Model, editable)

        fields_def = self.postprocess(model, node, view_id, False, fields)
        if node.tag in ('kanban', 'tree', 'form', 'gantt', 'map'):
            for action, operation in (('create', 'create'),
                                      ('delete', 'unlink'), ('edit', 'write')):
                if (not node.get(action) and
                        not Model.check_access_rights(
                            operation, raise_exception=False) or
                        not self._context.get(action, True) and is_base_model):
                    node.set(action, 'false')
        if node.tag in ('kanban',):
            group_by_name = node.get('default_group_by')
            if group_by_name in Model._fields:
                group_by_field = Model._fields[group_by_name]
                if group_by_field.type == 'many2one':
                    group_by_model = Model.env[group_by_field.comodel_name]
                    for action, operation in (('group_create', 'create'),
                                              ('group_delete', 'unlink'),
                                              ('group_edit', 'write')):
                        if (not node.get(action) and
                                not group_by_model.check_access_rights(
                                    operation, raise_exception=False) or
                            not self._context.get(action, True) and
                                is_base_model):
                            node.set(action, 'false')

        arch = etree.tostring(node, encoding="unicode").replace('\t', '')
        for k in list(fields):
            if k not in fields_def:
                del fields[k]
        for field in fields_def:
            if field in fields:
                fields[field].update(fields_def[field])
            else:
                message = _("Field `%(field_name)s` does not exist") % dict(
                    field_name=field)
                self.raise_view_error(message, view_id)

        missing = [item for item in attrs_fields if item[0] not in fields]
        if missing:
            msg_lines = []
            msg_fmt = _(
                "Field %r used in attributes must be present in view "
                "but is missing:")
            line_fmt = _(" - %r in %s=%r")
            for name, lines in itertools.groupby(
                    sorted(missing), itemgetter(0)):
                if msg_lines:
                    msg_lines.append("")
                msg_lines.append(msg_fmt % name)
                for line in lines:
                    msg_lines.append(line_fmt % line)
            self.raise_view_error("\n".join(msg_lines), view_id)

        return arch, fields
