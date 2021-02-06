# Changelog

All notable changes to this project will be documented in this file.

## [13.0.1.0.1] - 2021-02-01

### Added
- New google_maps view options for Markerclusterer
  - `cluster_grid_size`: The grid size of a cluster in pixels. The grid is a square. Default value `40`.
  - `cluster_max_zoom_level`: The maximum zoom level at which clustering is enabled or `null` if clustering is to be enabled at all zoom levels. Default value `7`
  - `cluster_zoom_on_click`: Whether to zoom the map when a cluster marker is clicked. You may want to set this to `false` if you have installed a handler for the `click` event and it deals with zooming on its own. Default value `true`
  - `cluster_image_path`: The full URL of the root name of the group of image files to use for cluster icons. The complete file name is of the form `imagePath`n.`imageExtension` where n is the image file number (1, 2, etc.). Default value `'/web_google_maps/static/lib/markercluster/img/m'`
### Fixed
  - Fix QWeb template for google_maps views button on the Enterprise version.
  - If you have issue when enabled Google Analytic and the "web_google_maps" is installed, please consider to install the module "website_google_library_loader".

### Changes
  - The QWeb template name
  - The style class name for the google_map view 
  - When opened record form view from the marker infowindow and then go back to the google_maps view, the view will not re-centered instead you stay on the location you visit previously
