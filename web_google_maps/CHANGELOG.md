# Change Log
## [14.0.2.0.4] - 2021-08-15
### Added
- Added eight new map styles: `muted_blue, pale_down, subtle_gray, shift_worker, even_lighter, unsaturated_brown, and uber`.
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
