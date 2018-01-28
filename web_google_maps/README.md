Web Google Maps
===============   

[![Demo](https://i.ytimg.com/vi/2UdG5ILDtiY/3.jpg)](https://youtu.be/2UdG5ILDtiY "Demo")    


This module contains three new features:
 - New view type and mode (`map`)
 - New widget (`gplaces_address_autocomplete`)
 - New widget (`gplaces_autocomplete`)
 

## Map view (`map`)
Basically, this new view(`map`) will integrate Google Maps into Odoo.    
Enable you to display a partner location or all your partners location around the world on a map.   
This feature will work seamlessly with Odoo means you can search your partner location using Odoo search feature.     

There are five available attributes that you can customize:
 - `no_limit` : attribute to tell the map either to load all records(markers) in a single load or take Odoo default behavior
 - `lat` : attritube to tell the map the latitude field on the object (mandatory)
 - `lng` : attritute to tell the map the longitude field on the object (mandatory)
 - `title` : attribute to tell the map the title that will be printed on marker info window (optional, by default 'name')
 - `color` : attribute to modify marker color (optional) any given color will set all markers color.
 - `colors` : work like attribute `color` but more configurable (you can set marker color depends on it's value) this attribute works similar to `colors` of tree view on Odoo 9.0
 
How to create the view?    
Example
>
    <!-- View -->
    <record id="view_partner_map" model="ir.ui.view">
        <field name="name">view.partner.map</field>
        <field name="model">res.partner</field>
        <field name="arch" type="xml">
            <!-- Define aliase name for geolocation fields into view attributes -->
            <map class="o_res_partner_map" no_limit="true" string="Map" lat="partner_latitude" lng="partner_longitude" colors="blue:company_type=='person';green:company_type=='company';">
                <field name="id"/>
                <field name="name"/>
                <field name="street"/>
                <field name="street2"/>
                <field name="city"/>
                <field name="zip"/>
                <field name="email"/>
                <field name="state_id"/>
                <field name="country_id"/>
                <field name="partner_latitude"/>
                <field name="partner_longitude"/>
                <field name="company_type"/>
                <field name="image_small"/>
                <field name="mobile"/>
                <field name="phone"/>
                <field name="type"/>
                <field name="function"/>
                <templates>
                    <t t-name="map-marker-iw">
                        <div class="gm-iw-container o_map_global_click o_res_partner_map">
                            <div class="gm-iw-title">
                                <img t-att-src="map_image('res.partner', 'image_small', record.id.raw_value)"/>
                                <span><strong><field name="display_name"/></strong></span>
                            </div>
                            <div class="gm-iw-details">
                                <ul>
                                    <li t-if="record.parent_id.raw_value and !record.function.raw_value"><field name="parent_id"/></li>
                                    <li t-if="!record.parent_id.raw_value and record.function.raw_value"><field name="function"/></li>
                                    <li t-if="record.parent_id.raw_value and record.function.raw_value"><field name="function"/> at <field name="parent_id"/></li>
                                    <li t-if="record.city.raw_value and !record.country_id.raw_value"><field name="city"/></li>
                                    <li t-if="!record.city.raw_value and record.country_id.raw_value"><field name="country_id"/></li>
                                    <li t-if="record.city.raw_value and record.country_id.raw_value"><field name="city"/>, <field name="country_id"/></li>
                                    <li t-if="record.email.raw_value" class="o_text_overflow"><field name="email"/></li>
                                    <li t-if="record.phone.raw_value">Phone: <field name="phone"/></li>
                                    <li t-if="record.mobile.raw_value">Mobile: <field name="mobile"/></li>
                                </ul>
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


## New widget (`gplaces_address_autocomplete`)

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
            <field name="street" widget="gplaces_address_autocomplete" options="{'component_form': {'street_number': 'short_name'}}"/>
            ...
        </field>
    </record>


### Fill fields (`fillfields`)
Is an option that will be influenced by `gplaces_address_autocomplete` widget.    
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

Basically this new widget will integrate "Google Place Autocomplete" (go and visit this [site](https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete)

This widget have similar configuration to `gplaces_address_autocomplete`.

### Component form (`component_form`)
Same configuration of `gplaces_address_autocomplete` component form

### Fill fields (`fillfields`)
This configuration works similar to `gplaces_address_autocomplete`.

By default this options are configured like following value:
>
    {
        general: {
            name: 'name',
            website: 'website',
            phone: ['international_phone_number', 'formatted_phone_number']
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
This module will install `base_setup` and `base_geolocalize` (no more `website_google_maps`).    
*I recommend you to add Google Maps Key API into Odoo Settings > General Settings when you installed this module*


The goal of this module is to bring the power of Google Maps into Odoo    
This module has tested on Odoo Version 10.0c    


Regards,  
Yopi  
yopiangi@gmail.com