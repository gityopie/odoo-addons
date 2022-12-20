# Change Log

## [15.0.1.0.3] - 2022-12-20
### Added

### Updated
- Update clustermarkerer source
### Fixed
- Fixed `google_map` view used inside `form` view

## [15.0.1.0.1] - 2022-04-10
### Added
- Improved "Edit geolocation" button functionality. Make easier for user to edit geolocation.
- Added "View on Google Maps" button on marker info window.
### Changed
### Fixed
- Fixed "Edit geolocation" button raised an error when record's geolocation is not set.

Migration to version 15.0
## [15.0.1.0.0] - 2022-02-16
Migration to version 15.0

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
