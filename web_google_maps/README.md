Web Google Maps
===============   

[![Demo](https://i.ytimg.com/vi/2UdG5ILDtiY/3.jpg)](https://youtu.be/5hvAubXgUnc "Demo")    


This module contains three new features:
 - New view type and mode (`map`)
 - New widget (`gplaces_address_form`)
 - New widget (`gplaces_autocomplete`)
 

## Map view (`map`)
Basically, this new view(`map`) will integrate Google Maps into Odoo.    
Enable you to display a partner location or all your partners location around the world on a map.   
This feature will work seamlessly with Odoo means you can search your partner location using Odoo search feature.     

There are five available attributes that you can customize:
 - `lat` : an attritube to tell the map the latitude field on the object (mandatory)
 - `lng` : an attritute to tell the map the longitude field on the object (mandatory)
 - `color` : an attribute to modify marker color (optional) any given color will set all markers color.
 - `colors` : work like attribute `color` but more configurable (you can set marker color depends on it's value) this attribute works similar to `colors` of tree view on Odoo 9.0
 
How to create the view?    
Example
>
    <!-- View -->
    <record id="view_partner_map" model="ir.ui.view">
        <field name="name">view.partner.map</field>
        <field name="model">res.partner</field>
        <field name="arch" type="xml">
            <map string="Map" lat="partner_latitude" lng="partner_longitude" colors="blue:company_type=='person';green:company_type=='company';">
                <field name="color"/>
                <field name="display_name"/>
                <field name="email"/>
                <field name="parent_id"/>
                <field name="is_company"/>
                <field name="function"/>
                <field name="phone"/>
                <field name="street"/>
                <field name="street2"/>
                <field name="zip"/>
                <field name="city"/>
                <field name="country_id"/>
                <field name="mobile"/>
                <field name="state_id"/>
                <field name="category_id"/>
                <field name="image_small"/>
                <field name="type"/>
                <field name="partner_latitude"/>
                <field name="partner_longitude"/>
                <field name="company_type"/>
                <templates>
                    <t t-name="kanban-box">
                        <div class="oe_kanban_global_click">
                            <div class="o_kanban_tags_section oe_kanban_partner_categories">
                                <span class="oe_kanban_list_many2many">
                                    <field name="category_id" widget="many2many_tags" options="{'color_field': 'color'}"/>
                                </span>
                            </div>
                            <div class="o_kanban_image">
                                <t t-if="record.image_small.raw_value">
                                    <img t-att-src="kanban_image('res.partner', 'image_small', record.id.value)"/>
                                </t>
                                <t t-if="!record.image_small.raw_value">
                                    <t t-if="record.type.raw_value === 'delivery'">
                                        <img t-att-src='_s + "/base/static/src/img/truck.png"' class="o_kanban_image oe_kanban_avatar_smallbox"/>
                                    </t>
                                    <t t-if="record.type.raw_value === 'invoice'">
                                        <img t-att-src='_s + "/base/static/src/img/money.png"' class="o_kanban_image oe_kanban_avatar_smallbox"/>
                                    </t>
                                    <t t-if="record.type.raw_value != 'invoice' &amp;&amp; record.type.raw_value != 'delivery'">
                                        <t t-if="record.is_company.raw_value === true">
                                            <img t-att-src='_s + "/base/static/src/img/company_image.png"'/>
                                        </t>
                                        <t t-if="record.is_company.raw_value === false">
                                            <img t-att-src='_s + "/base/static/src/img/avatar.png"'/>
                                        </t>
                                    </t>
                                </t>
                            </div>
                            <div class="oe_kanban_details">
                                <strong class="oe_partner_heading">
                                    <field name="display_name"/>
                                </strong>
                                <ul>
                                    <li t-if="record.parent_id.raw_value and !record.function.raw_value">
                                        <field name="parent_id"/>
                                    </li>
                                    <li t-if="!record.parent_id.raw_value and record.function.raw_value">
                                        <field name="function"/>
                                    </li>
                                    <li t-if="record.parent_id.raw_value and record.function.raw_value">
                                        <field name="function"/> at <field name="parent_id"/>
                                    </li>
                                    <li t-if="record.city.raw_value and !record.country_id.raw_value">
                                        <field name="city"/>
                                    </li>
                                    <li t-if="!record.city.raw_value and record.country_id.raw_value">
                                        <field name="country_id"/>
                                    </li>
                                    <li t-if="record.city.raw_value and record.country_id.raw_value">
                                        <field name="city"/>, <field name="country_id"/>
                                    </li>
                                    <li t-if="record.email.raw_value" class="o_text_overflow">
                                        <field name="email"/>
                                    </li>
                                </ul>
                                <div class="oe_kanban_partner_links"/>
                            </div>
                        </div>
                    </t>
                </templates>
            </map>
        </field>
    </record>
    
    <!-- Action -->
    <record id="action_partner_map" model="ir.actions.act_window">
        ...
        <field name="view_type">form</field>
        <field name="view_mode">tree,form,map</field>
        ...
    </record>


The view looks familiar?    
Yes, you're right.    
The marker infowindow will use `kanban-box` kanban card style.    


##  How to setup color for marker on map?

There are two attributes:
 - `colors` 
 - `color` 

Example:
> 
	<!-- colors -->
    <map string="Map" lat="partner_latitude" lng="partner_longitude" colors="green:company_type=='person';blue:company_type=='company';">
        ...
    </map>

    <!-- color -->
    <map string="Map" lat="partner_latitude" lng="partner_longitude" color="orange">
        ...
    </map>


## New widget (`gplaces_address_form`)

Basically this new widget will integrate another cool feature of Google Maps which is "Place Autocomplete Address Form" (go and visit this [site](https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete-addressform) if you don't know yet how this cool feature work) 

The widget has four options that can be modify:
 - `component_form`
 - `fillfields`
 - `lat`
 - `lng`

### Component form (`component_form`)
Is an option used to modify which value you want to take from an objects returned by the geocoder.    
Full documentation about Google component types can be found [here](https://developers.google.com/maps/documentation/geocoding/intro#Types)

By default this option are configured like following value:
>
    {
        'street_number': 'long_name',
        'route': 'long_name',
        'intersection': 'short_name',
        'political': 'short_name',
        'country': 'short_name',
        'administrative_area_level_1': 'short_name',
        'administrative_area_level_2': 'short_name',
        'administrative_area_level_3': 'short_name',
        'administrative_area_level_4': 'short_name',
        'administrative_area_level_5': 'short_name',
        'colloquial_area': 'short_name',
        'locality': 'short_name',
        'ward': 'short_name',
        'sublocality_level_1': 'short_name',
        'sublocality_level_2': 'short_name',
        'sublocality_level_3': 'short_name',
        'sublocality_level_5': 'short_name',
        'neighborhood': 'short_name',
        'premise': 'short_name',
        'postal_code': 'short_name',
        'natural_feature': 'short_name',
        'airport': 'short_name',
        'park': 'short_name',
        'point_of_interest': 'long_name'
    }

This configuration can be modify into view field definition.    
Example:
> 
    <record id="view_res_partner_form" model="ir.ui.view">
       ...
       <field name="arch" type="xml">
            ...
            <field name="street" widget="gplaces_address_form" options="{'component_form': {'street_number': 'short_name'}}"/>
            ...
        </field>
    </record>


### Fill fields (`fillfields`)
Is an option that will be influenced by `gplaces_address_form` widget.    
This options should contains known `fields` that you want to set a value for each field automatically.    
A field can contains one or multiple elements of component form    
By default this options are configured like following value:
>
    {
        'street': ['street_number', 'route'],
        'street2': ['administrative_area_level_3', 'administrative_area_level_4', 'administrative_area_level_5'],
        'city': ['locality', 'administrative_area_level_2'],
        'zip': 'postal_code',
        'state_id': 'administrative_area_level_1',
        'country_id': 'country',
    }

        
This configuration can be modify into view field definition as well    
Example:
>
    <record id="view_res_partner_form" model="ir.ui.view">
        ...
        <field name="arch" type="xml">
            ...
            <field name="street" widget="google_places" options="{'fillfields': {'street2': ['route', 'street_number']}}"/>
            ...
        </field>
    </record>

### Latitude (`lat`) and Longitude (`lng`)
This options tell the widget the fields geolocation, in order to have this fields filled automatically.


## New widget (`gplaces_autocomplete`)

Basically this new widget will integrate another cool feature of Google Maps which is "Place Autocomplete" (go and visit this [site](https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete) if you don't know yet how this cool feature work) 

This widget have similar configuration to `gplaces_address_form`.

### Component form (`component_form`)
Same configuration of `gplaces_address_form` component form

### Fill fields (`fillfields`)
This configuration works similar to `gplace_address_form`.

By default this options are configured like following value:
>
    {
        general: {
            name: 'name',
            website: 'website',
            phone: ['international_phone_number', 'formatted_phone_number']
        },
        geolocation: {
            partner_latitude: 'latitude',
            partner_longitude: 'longitude'
        },
        address: {
            street: ['street_number', 'route'],
            street2: ['administrative_area_level_3', 'administrative_area_level_4', 'administrative_area_level_5'],
            city: ['locality', 'administrative_area_level_2'],
            zip: 'postal_code',
            state_id: 'administrative_area_level_1',
            country_id: 'country'
        }
    };

# Technical:
This module will install `base_geolocalize` and `base_setup`.       
*I recommend you to add Google Maps Key API into Odoo Website Admin settings when you installed this module*


The goal of this module is to bring the power of Google Maps into Odoo    
This module has tested on Odoo Version 10.0c    


[![ko-fi](https://www.ko-fi.com/img/donate_sm.png)](https://ko-fi.com/P5P4FOM0), if you want to support me to keep this project maintained. Thanks :)

Regards,  
Yopi  
yopiangi@gmail.com