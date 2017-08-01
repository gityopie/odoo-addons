Web Google Maps
===============    

[![Demo](https://img.youtube.com/vi/A-VbWwznuhc/0.jpg)](https://youtu.be/YmM-8VCNRzE "Demo")    


This module contains two new features:
 - New view type and mode (`map`)
 - New widget (`google_places`)
 

## Map view (`map`)
Basically, this new view(`map`) will integrate Google Maps into Odoo.    
Enable you to display a partner location or all your partners location around the world on a map.   
This feature will work seamlessly with Odoo means you can search your partner location using Odoo search feature.    

_[08 July 2017]_    
- Not just partner(`res.partner`) model but any model contains geolocation fields    

_[22 July 2017]_    
- Map Localization.   
- Add places autocomplete to the map.    
- Create new partner within the map.    

How to create the view?    
Example
>
    <!-- View -->
    <record id="view_partner_map" model="ir.ui.view">
        <field name="name">view.partner.map</field>
        <field name="model">res.partner</field>
        <field name="arch" type="xml">
            <!-- Define aliase name for geolocation fields into view attributes -->
            <map string="Map" lat="partner_latitude" lng="partner_longitude">
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

 #### Note:
 This view required `fields` contains geolocation information (`partner_latitude` and `partner_longitude`) and the other fields will be use for marker infowindow.    
 
 ***IMPORTANT!*** (Update: 08 July 2017)   
You have to set alias name for fields geolocation into `map` attributes  
- __lat__ : latitude
- __lng__: longitude 


## New widget (`google_places`)

Basically this new widget will integrate another cool feature of Google Maps which is "Place Autocomplete Address Form" (go and visit this [site](https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete-addressform) if you don't know yet how this cool feature work) 

The widget (`google_places`) has two options that can be modify:
 - `component_form`   
 - `fillfields`

### Component form (`component_form`)
Is an option used to modify which value you want to take from an objects returned by the geocoder.    
Full documentation about Google component types can be found [here](https://developers.google.com/maps/documentation/geocoding/intro#Types)

By default this option are configured like following value:
>
    'component_form': {
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
            <field name="street" widget="google_places" options="{'component_form': {'street_number': 'short_name'}}"/>
            ...
        </field>
    </record>


### Fill fields (`fillfields`)
Is an option that will be influenced by `google_places` widget.    
This options should contains known `fields` that you want to set a value for each field automatically.    
A field can contains one or multiple elements of component form    
By default this options are configured like following value:
>
    'fillfields': {
        'street': ['street_number', 'route', 'name'],
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
            <field name="street" widget="google_places" options="{'fillfields': {'street2': ['street_number']}}"/>
            ...
        </field>
    </record>


Note: this widget will set partner geolocation automatically whenever to pick or select an address from google autocomplete.

# Technical:
This module will install `website_google_maps`.    
*I recommend you to add Google Maps Key API into Odoo Website Admin settings when you installed this module*


The goal of this module is to bring the power of Google Maps into Odoo    
This module has tested on Odoo Version 10.0c    


Regards,  
Yopi  
yopiangi[at]gmail[dot]com
