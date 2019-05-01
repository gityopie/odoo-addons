Web Google Maps Drawing
=======================   

[![Demo](https://i.ytimg.com/vi/DDUFT6XP8AU/2.jpg)](https://youtu.be/DDUFT6XP8AU "Demo")    

This module will integrate Google Maps Drawing that allows you to draw a shape on a map.    
You can find the document [here](https://developers.google.com/maps/documentation/javascript/examples/drawing-tools)


## New widget `map_drawing_shape`

This module will support three kind of shapes:    
- [Rectangle](https://developers.google.com/maps/documentation/javascript/examples/rectangle-simple)    
- [Polygon](https://developers.google.com/maps/documentation/javascript/examples/polygon-simple)    
- [Circle](https://developers.google.com/maps/documentation/javascript/examples/polygon-simple)    


## Drawing Mixin    
To ease the implementation of this feature, I defined a mixin class that you can use in your model
```python
    class GoogleMapsDrawingShapeMixin(models.AbstractModel):
        _name = 'google_maps.drawing.shape.mixin'
        _description = 'Google Maps Shape Mixin'
        _rec_name = 'shape_name'
    
        shape_name = fields.Char(string='Name')
        shape_area = fields.Float(string='Area')
        shape_radius = fields.Float(string='Radius')
        shape_description = fields.Text(string='Description')
        shape_type = fields.Selection([
            ('circle', 'Circle'), ('polygon', 'Polygon'),
            ('rectangle', 'Rectangle')], string='Type', default='polygon', 
            required=True)
        shape_paths = fields.Text(string='Paths')
    
        @api.multi
        def decode_shape_paths(self):
            self.ensure_one()
            return safe_eval(self.shape_paths)
```
How to use the widget
```xml
     <field name="shape_paths" widget="map_drawing_shape"/>
```

How to load shape(s) on `map` view
```xml
    <record id="view_res_partner_area_map" model="ir.ui.view">
        <field name="name">view.res.partner.area.map</field>
        <field name="model">res.partner.area</field>
        <field name="arch" type="xml">
            <map library="drawing" string="Shape">
                <field name="partner_id"/>
                <field name="shape_name"/>
                <field name="shape_description"/>
                <field name="shape_type"/>
                <field name="shape_radius"/>
                <field name="shape_area"/>
                <field name="shape_paths"/>
                <templates>
                    <t t-name="kanban-box">
                        <div class="oe_kanban_global_click">
                            <div class="oe_kanban_details">
                                <strong class="o_kanban_record_title oe_partner_heading">
                                    <field name="shape_name"/>
                                </strong>
                                <div>
                                    <field name="shape_description"/>
                                </div>
                                <div attrs="{'invisible': [('shape_type', 'not in', ['rectangle', 'polygon'])]}">
                                    Area: <field name="shape_area"/>
                                </div>
                                <div attrs="{'invisible': [('shape_type', '!=', 'circle')]}">
                                    Radius: <field name="shape_radius"/>
                                </div>
                            </div>
                        </div>
                    </t>
                </templates>
            </map>
        </field>
    </record>
```
_I have created a simple use case (custom module) to show you how to use the widget_

# Module Dependency:
This module will install `web_google_maps`.    
*I recommend you to add Google Maps Key API into Odoo Settings > General Settings when you installed this module*

[![ko-fi](https://www.ko-fi.com/img/donate_sm.png)](https://ko-fi.com/P5P4FOM0),    
if you want to support me to keep this project maintained. Thanks :)

Regards,  
Yopi  
yopiangi@gmail.com