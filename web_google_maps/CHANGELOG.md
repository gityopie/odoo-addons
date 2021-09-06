# Change Log

## [14.0.2.1.5] - 2021-09-05
### Added
- Add toggle button (show/hide) google_map sidebar
- Add new button (custom control) in the map, a button to geolocate user current location
### Changed
- Updated map gestureHandling value, added all supported values `auto`, `greedy`, `cooperative`, and `none` (previous only two: `greedy` and `cooperative`). For more detail check https://developers.google.com/maps/documentation/javascript/interaction#controlling_gesture_handling
### Fixed

## [14.0.2.0.5] - 2021-08-29
### Added
- Improved widget `gplaces_address_autocomplete` by added new options `force_override`. This options allows you to override the default options `fillfields`.    
     Example:
     ```xml
     <field name="site_street" widget="gplaces_address_autocomplete" options="{
        'lat': 'site_latitude',
        'lng': 'site_longitude',
        'fillfields': {
            'site_street': ['street_number', 'route'],
            'site_street2': ['administrative_area_level_3', 'administrative_area_level_4', 'administrative_area_level_5'],
            'site_city': ['locality', 'administrative_area_level_2'],
            'site_zip': 'postal_code',
            'site_state_id': 'administrative_area_level_1',
            'site_country_id': 'country',
        },
        'force_override': true,
    }" placeholder="Street..." class="o_address_street"/>
     ```
### Changed
### Fixed

## [14.0.2.0.4] - 2021-08-15
### Added
- Added seven new map styles: `muted_blue, pale_down, subtle_gray, shift_worker, even_lighter, unsaturated_brown, and uber`.
- Added new attribute `map_style` to the `google_map` view. This attribute allows you set different map style for different model. This new attribute will override global map style configuration.    
    Example: 
    ```xml
        <google_map map_style="unsaturated_brown">
            ...
        </google_map>
    ```

### Changed    
-  Updated both Google autocomplete widgets by define new function `get_google_fields_restriction` where list of Google fields are defined.

### Fixed    

## [14.0.2.0.3] - 2021-08-06
### Added    

### Changed    

### Fixed
- Fixed `google_map` sidebar does not re-render when next page or previous page is clicked.
