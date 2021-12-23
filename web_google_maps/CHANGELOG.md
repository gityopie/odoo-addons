# Change Log


## [14.0.2.1.9] - 2021-12-23
### Added
### Changed
### Fixed
- Fixed map center does not working properly on every condition (include when map is loaded inside form view). The solution applied is by add a delay to the map center function execution.
- Fixed button 'Navigate to' does not fired when the map is loaded inside form view.
- Fixed button 'Open' issue when the map is loaded inside form view.
## [14.0.2.1.8] - 2021-12-22
### Added
- Added button navigate on marker info window. This button will open Google maps website with direction enabled on new browser tab. This feature is enable by default, if you don't want to use this feature, you can disable it via view attribute.   
Example:
```xml
    <google_map disable_navigation="1">
        ...
    </google_map>
```
- Added new button "Open" on marker info window. You will need to click this button to switch to form view.
### Changed
- Marker info window is no longer open record form view when it's clicked. Need to click "Open" button to open record form view.
### Fixed


## [14.0.2.1.7] - 2021-10-20
### Added
### Changed
### Fixed
- Fixed `google_map` sidebar issue when the view is loaded inside form view.
- Added missing `google_map` attributes when it's instantiate inside form view (used to display one2many fields)

## [14.0.2.1.6] - 2021-10-17
### Added
- Add two new attributes: `sidebar_title` and `sidebar_subtitle`. These two attributes are used to display record title and subtitle on the sidebar.    
    Example:
    ```xml
        <google_map sidebar_title="display_name" sidebar_subtitle="contact_address">
           ...
        </google_map>
    ```
  Note: Only fields type `Char` is supported.
### Changed
### Fixed


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
