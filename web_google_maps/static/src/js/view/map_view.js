odoo.define('web.MapView', function (require) {
    'use strict';

    var core = require('web.core');
    var ajax = require('web.ajax');
    var data = require('web.data');
    var data_manager = require('web.data_manager');
    var View = require('web.View');
    var Dialog = require('web.Dialog');
    var session = require('web.session');
    var QWeb = require('web.QWeb');
    var Pager = require('web.Pager');
    var utils = require('web.utils');
    var MapControls = require('web_google_maps.MapsControls');

    var MapViewPlacesAutocomplete = require('web.MapViewPlacesAutocomplete');
    var KanbanRecord = require('web_kanban.Record');
    var kanban_widgets = require('web_kanban.widgets');
    var fields_registry = kanban_widgets.registry;

    var qweb = core.qweb;
    var _lt = core._lt;
    var _t = core._t;

    var MARKER_ICON_COLORS = [
        'green', 'yellow', 'blue', 'light-green',
        'red', 'magenta', 'black', 'purple', 'orange',
        'pink', 'grey', 'brown', 'cyan', 'white'
    ];

    var MAP_STYLE = {
        'default': [],
        'aubergine': [{
                "elementType": "geometry",
                "stylers": [{
                    "color": "#1d2c4d"
                }]
            },
            {
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#8ec3b9"
                }]
            },
            {
                "elementType": "labels.text.stroke",
                "stylers": [{
                    "color": "#1a3646"
                }]
            },
            {
                "featureType": "administrative.country",
                "elementType": "geometry.stroke",
                "stylers": [{
                    "color": "#4b6878"
                }]
            },
            {
                "featureType": "administrative.land_parcel",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#64779e"
                }]
            },
            {
                "featureType": "administrative.province",
                "elementType": "geometry.stroke",
                "stylers": [{
                    "color": "#4b6878"
                }]
            },
            {
                "featureType": "landscape.man_made",
                "elementType": "geometry.stroke",
                "stylers": [{
                    "color": "#334e87"
                }]
            },
            {
                "featureType": "landscape.natural",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#023e58"
                }]
            },
            {
                "featureType": "poi",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#283d6a"
                }]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#6f9ba5"
                }]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text.stroke",
                "stylers": [{
                    "color": "#1d2c4d"
                }]
            },
            {
                "featureType": "poi.business",
                "stylers": [{
                    "visibility": "off"
                }]
            },
            {
                "featureType": "poi.park",
                "elementType": "geometry.fill",
                "stylers": [{
                    "color": "#023e58"
                }]
            },
            {
                "featureType": "poi.park",
                "elementType": "labels.text",
                "stylers": [{
                    "visibility": "off"
                }]
            },
            {
                "featureType": "poi.park",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#3C7680"
                }]
            },
            {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#304a7d"
                }]
            },
            {
                "featureType": "road",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#98a5be"
                }]
            },
            {
                "featureType": "road",
                "elementType": "labels.text.stroke",
                "stylers": [{
                    "color": "#1d2c4d"
                }]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#2c6675"
                }]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.stroke",
                "stylers": [{
                    "color": "#255763"
                }]
            },
            {
                "featureType": "road.highway",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#b0d5ce"
                }]
            },
            {
                "featureType": "road.highway",
                "elementType": "labels.text.stroke",
                "stylers": [{
                    "color": "#023e58"
                }]
            },
            {
                "featureType": "transit",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#98a5be"
                }]
            },
            {
                "featureType": "transit",
                "elementType": "labels.text.stroke",
                "stylers": [{
                    "color": "#1d2c4d"
                }]
            },
            {
                "featureType": "transit.line",
                "elementType": "geometry.fill",
                "stylers": [{
                    "color": "#283d6a"
                }]
            },
            {
                "featureType": "transit.station",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#3a4762"
                }]
            },
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#0e1626"
                }]
            },
            {
                "featureType": "water",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#4e6d70"
                }]
            }
        ],
        'night': [{
                "elementType": "geometry",
                "stylers": [{
                    "color": "#242f3e"
                }]
            },
            {
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#746855"
                }]
            },
            {
                "elementType": "labels.text.stroke",
                "stylers": [{
                    "color": "#242f3e"
                }]
            },
            {
                "featureType": "administrative.locality",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#d59563"
                }]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text",
                "stylers": [{
                    "visibility": "off"
                }]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#d59563"
                }]
            },
            {
                "featureType": "poi.business",
                "stylers": [{
                    "visibility": "off"
                }]
            },
            {
                "featureType": "poi.park",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#263c3f"
                }]
            },
            {
                "featureType": "poi.park",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#6b9a76"
                }]
            },
            {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#38414e"
                }]
            },
            {
                "featureType": "road",
                "elementType": "geometry.stroke",
                "stylers": [{
                    "color": "#212a37"
                }]
            },
            {
                "featureType": "road",
                "elementType": "labels.icon",
                "stylers": [{
                    "visibility": "off"
                }]
            },
            {
                "featureType": "road",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#9ca5b3"
                }]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#746855"
                }]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.stroke",
                "stylers": [{
                    "color": "#1f2835"
                }]
            },
            {
                "featureType": "road.highway",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#f3d19c"
                }]
            },
            {
                "featureType": "transit",
                "stylers": [{
                    "visibility": "off"
                }]
            },
            {
                "featureType": "transit",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#2f3948"
                }]
            },
            {
                "featureType": "transit.station",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#d59563"
                }]
            },
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#17263c"
                }]
            },
            {
                "featureType": "water",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#515c6d"
                }]
            },
            {
                "featureType": "water",
                "elementType": "labels.text.stroke",
                "stylers": [{
                    "color": "#17263c"
                }]
            }
        ],
        'dark': [{
                "elementType": "geometry",
                "stylers": [{
                    "color": "#212121"
                }]
            },
            {
                "elementType": "labels.icon",
                "stylers": [{
                    "visibility": "off"
                }]
            },
            {
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#757575"
                }]
            },
            {
                "elementType": "labels.text.stroke",
                "stylers": [{
                    "color": "#212121"
                }]
            },
            {
                "featureType": "administrative",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#757575"
                }]
            },
            {
                "featureType": "administrative.country",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#9e9e9e"
                }]
            },
            {
                "featureType": "administrative.land_parcel",
                "stylers": [{
                    "visibility": "off"
                }]
            },
            {
                "featureType": "administrative.locality",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#bdbdbd"
                }]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#757575"
                }]
            },
            {
                "featureType": "poi.park",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#181818"
                }]
            },
            {
                "featureType": "poi.park",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#616161"
                }]
            },
            {
                "featureType": "poi.park",
                "elementType": "labels.text.stroke",
                "stylers": [{
                    "color": "#1b1b1b"
                }]
            },
            {
                "featureType": "road",
                "elementType": "geometry.fill",
                "stylers": [{
                    "color": "#2c2c2c"
                }]
            },
            {
                "featureType": "road",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#8a8a8a"
                }]
            },
            {
                "featureType": "road.arterial",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#373737"
                }]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#3c3c3c"
                }]
            },
            {
                "featureType": "road.highway.controlled_access",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#4e4e4e"
                }]
            },
            {
                "featureType": "road.local",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#616161"
                }]
            },
            {
                "featureType": "transit",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#757575"
                }]
            },
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#000000"
                }]
            },
            {
                "featureType": "water",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#3d3d3d"
                }]
            }
        ],
        'retro': [{
                "elementType": "geometry",
                "stylers": [{
                    "color": "#ebe3cd"
                }]
            },
            {
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#523735"
                }]
            },
            {
                "elementType": "labels.text.stroke",
                "stylers": [{
                    "color": "#f5f1e6"
                }]
            },
            {
                "featureType": "administrative",
                "elementType": "geometry.stroke",
                "stylers": [{
                    "color": "#c9b2a6"
                }]
            },
            {
                "featureType": "administrative.land_parcel",
                "elementType": "geometry.stroke",
                "stylers": [{
                    "color": "#dcd2be"
                }]
            },
            {
                "featureType": "administrative.land_parcel",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#ae9e90"
                }]
            },
            {
                "featureType": "landscape.natural",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#dfd2ae"
                }]
            },
            {
                "featureType": "poi",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#dfd2ae"
                }]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#93817c"
                }]
            },
            {
                "featureType": "poi.park",
                "elementType": "geometry.fill",
                "stylers": [{
                    "color": "#a5b076"
                }]
            },
            {
                "featureType": "poi.park",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#447530"
                }]
            },
            {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#f5f1e6"
                }]
            },
            {
                "featureType": "road.arterial",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#fdfcf8"
                }]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#f8c967"
                }]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.stroke",
                "stylers": [{
                    "color": "#e9bc62"
                }]
            },
            {
                "featureType": "road.highway.controlled_access",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#e98d58"
                }]
            },
            {
                "featureType": "road.highway.controlled_access",
                "elementType": "geometry.stroke",
                "stylers": [{
                    "color": "#db8555"
                }]
            },
            {
                "featureType": "road.local",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#806b63"
                }]
            },
            {
                "featureType": "transit.line",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#dfd2ae"
                }]
            },
            {
                "featureType": "transit.line",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#8f7d77"
                }]
            },
            {
                "featureType": "transit.line",
                "elementType": "labels.text.stroke",
                "stylers": [{
                    "color": "#ebe3cd"
                }]
            },
            {
                "featureType": "transit.station",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#dfd2ae"
                }]
            },
            {
                "featureType": "water",
                "elementType": "geometry.fill",
                "stylers": [{
                    "color": "#b9d3c2"
                }]
            },
            {
                "featureType": "water",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#92998d"
                }]
            }
        ],
        'silver': [{
                "elementType": "geometry",
                "stylers": [{
                    "color": "#f5f5f5"
                }]
            },
            {
                "elementType": "labels.icon",
                "stylers": [{
                    "visibility": "off"
                }]
            },
            {
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#616161"
                }]
            },
            {
                "elementType": "labels.text.stroke",
                "stylers": [{
                    "color": "#f5f5f5"
                }]
            },
            {
                "featureType": "administrative.land_parcel",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#bdbdbd"
                }]
            },
            {
                "featureType": "poi",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#eeeeee"
                }]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#757575"
                }]
            },
            {
                "featureType": "poi.park",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#e5e5e5"
                }]
            },
            {
                "featureType": "poi.park",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#9e9e9e"
                }]
            },
            {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#ffffff"
                }]
            },
            {
                "featureType": "road.arterial",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#757575"
                }]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#dadada"
                }]
            },
            {
                "featureType": "road.highway",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#616161"
                }]
            },
            {
                "featureType": "road.local",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#9e9e9e"
                }]
            },
            {
                "featureType": "transit.line",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#e5e5e5"
                }]
            },
            {
                "featureType": "transit.station",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#eeeeee"
                }]
            },
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#c9c9c9"
                }]
            },
            {
                "featureType": "water",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#9e9e9e"
                }]
            }
        ]
    }

    var MapView = View.extend({
        template: 'MapView',
        accesskey: "m",
        className: 'o_map_view',
        display_name: _lt('Map'),
        defaults: _.extend(View.prototype.defaults, {
            quick_creatable: true,
            creatable: true,
            create_text: undefined,
            read_only_mode: false,
            confirm_on_delete: true,
        }),
        icon: 'fa-map-o',
        mobile_friendly: true,
        custom_events: {
            'kanban_record_open': 'open_record',
            'kanban_record_edit': 'edit_record',
            'kanban_record_delete': 'delete_record',
            'kanban_record_update': 'update_record',
            'kanban_do_action': 'open_action',
            'kanban_column_archive_records': 'archive_records',
            'kanban_call_method': 'call_method',
        },
        init: function () {
            this._super.apply(this, arguments);
            this.qweb = new QWeb(session.debug, {
                _s: session.origin
            }, false);
            this.markers = [];
            this.map = false;
            this.shown = $.Deferred();
            this.data = undefined;
            this.limit = this.options.limit || parseInt(this.fields_view.arch.attrs.limit, 10) || 40;
            this.default_group_by = this.fields_view.arch.attrs.default_group_by;
            this.fields = this.fields_view.fields;
            this.fields_keys = _.keys(this.fields_view.fields);
            this.children_field = this.fields_view.field_parent;
            this.geocoder = new google.maps.Geocoder;
            this.search_orderer = new utils.DropMisordered();
            // Retrieve many2manys stored in the fields_view if it has already been processed
            this.many2manys = this.fields_view.many2manys || [];
            this.m2m_context = {};
            this.widgets = [];
        },
        init_map: function () {
            this.map = new google.maps.Map(this.$('.o_map_view').get(0), {
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                zoom: 3,
                minZoom: 3,
                maxZoom: 20,
                fullscreenControl: true,
                mapTypeControl: true,
                mapTypeControlOptions: {
                    mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
                    style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                    position: google.maps.ControlPosition.TOP_CENTER
                }
            });
            this.set_map_theme();
            this.marker_cluster = new MarkerClusterer(this.map, [], {
                imagePath: '/web_google_maps/static/src/img/m',
                gridSize: 20,
                maxZoom: 17
            });
            this.on_maps_add_controls();
        },
        start: function () {
            this.init_map();
            return this._super();
        },
        willStart: function () {
            this.get_marker_iw_template();
            this.set_geolocation_fields();
            this.set_marker_colors();
            return this._super();
        },
        /**
         * Style map
         */
        set_map_theme: function () {
            var self = this;
            var update_map = function (style) {
                var styledMapType = new google.maps.StyledMapType(MAP_STYLE[style], {
                    name: 'Styled map'
                });
                self.map.setOptions({
                    mapTypeControlOptions: {
                        mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain', 'styled_map'],
                        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                        position: google.maps.ControlPosition.TOP_CENTER
                    }
                });
                //Associate the styled map with the MapTypeId and set it to display.
                self.map.mapTypes.set('styled_map', styledMapType);
                self.map.setMapTypeId('styled_map');
            }
            if (!this.map_theme) {
                ajax.jsonRpc('/web/map_theme').then(function (data) {
                    if (data) {
                        if (MAP_STYLE.hasOwnProperty(data.theme) && data.theme !== 'default') {
                            self.map_theme = data.theme;
                            update_map(data.theme);
                        }
                    }
                });
            }
        },
        /**
         * This method is adopted from kanban view
         * to manage marker info window
         */
        get_marker_iw_template: function () {
            var child;
            for (var i = 0, ii = this.fields_view.arch.children.length; i < ii; i++) {
                child = this.fields_view.arch.children[i];
                if (child.tag === "templates") {
                    transform_qweb_template(child, this.fields_view, this.many2manys);
                    this.fields_view.many2manys = this.many2manys;
                    this.qweb.add_template(utils.json_node_to_xml(child));
                    break;
                } else if (child.tag === 'field') {
                    var ftype = child.attrs.widget || this.fields[child.attrs.name].type;
                    if (ftype === "many2many" && "context" in child.attrs) {
                        this.m2m_context[child.attrs.name] = child.attrs.context;
                    }
                }
            }
        },
        set_geolocation_fields: function () {
            if (this.fields_view.arch.attrs.lat && this.fields_view.arch.attrs.lng) {
                this.latitude = this.fields_view.arch.attrs.lat;
                this.longitude = this.fields_view.arch.attrs.lng;
                return true;
            } else {
                this.do_warn(_t('Error: cannot display locations'), _t('Please define alias name for geolocations fields for map view!'));
                return false;
            }
        },
        set_marker_colors: function () {
            if (this.fields_view.arch.attrs.colors) {
                this.colors = _(this.fields_view.arch.attrs.colors.split(';')).chain()
                    .compact()
                    .map(function (color_pair) {
                        var pair = color_pair.split(':'),
                            color = pair[0],
                            expr = pair[1];
                        return [color, py.parse(py.tokenize(expr)), expr];
                    }).value();
            }
            if (this.fields_view.arch.attrs.color) {
                this.color = this.fields_view.arch.attrs.color;
            }
        },
        get_marker_color: function (record) {
            if (!this.colors) {
                return '';
            }

            var context, pair, color, expression, i, len;
            context = _.mapObject(_.extend({}, record, {
                uid: session.uid,
                current_date: moment().format('YYYY-MM-DD') // TODO: time, datetime, relativedelta
            }), function (val, key) {
                return (val instanceof Array) ? (_.last(val) || '') : val;
            });
            for (i = 0, len = this.colors.length; i < len; ++i) {
                pair = this.colors[i];
                color = pair[0];
                expression = pair[1];
                if (py.PY_isTrue(py.evaluate(expression, context))) {
                    return color;
                }
                // TODO: handle evaluation errors
            }
            return '';
        },
        load_markers: function () {
            var self = this;
            var latLng;

            this.clear_markers_cluster();
            if (this.data.is_empty) {
                this.do_notify(_t('No geolocation is found!'));
                return false;
            }

            return $.when(this.data.records.forEach(function (record) {
                if (record[self.latitude] && record[self.longitude]) {
                    latLng = new google.maps.LatLng(record[self.latitude], record[self.longitude]);
                    self._create_marker(latLng, record);
                };
            })).then(function () {
                self.map_centered();
            });
        },
        load_records: function (offset, dataset) {
            var options = {
                'limit': this.limit,
                'offset': offset
            };
            dataset = dataset || this.dataset;
            this.infowindow = new google.maps.InfoWindow();
            return dataset.read_slice(this.fields_keys.concat(['__last_update']), options)
                .then(function (records) {
                    return {
                        records: records,
                        is_empty: !records.length,
                        grouped: false, // this moment, grouped will not be applied on this view.
                    };
                });
        },
        render_pager: function ($node, options) {
            var self = this;
            this.pager = new Pager(this, this.dataset.size(), 1, this.limit, options);
            this.pager.appendTo($node);
            this.pager.on('pager_changed', this, function (state) {
                self.limit = state.limit;
                self.load_records(state.current_min - 1)
                    .then(function (data) {
                        self.data = data;
                    })
                    .done(this.proxy('render'));
            });
            this.update_pager();
        },
        render: function () {
            this.record_options = {
                editable: this.is_action_enabled('edit'),
                deletable: this.is_action_enabled('delete'),
                fields: this.fields_view.fields,
                qweb: this.qweb,
                model: this.model,
                read_only_mode: this.options.read_only_mode,
            };
            this.load_markers();
        },
        update_pager: function () {
            if (this.pager) {
                this.pager.update_state({
                    size: this.dataset.size(),
                    current_min: 1
                });
            }
        },
        is_action_enabled: function (action) {
            if (action === 'create' && !this.options.creatable) {
                return false;
            }
            return this._super(action);
        },
        has_active_field: function () {
            return this.fields_view.fields.active;
        },
        _get_icon_color: function (record) {
            if (this.color) {
                return this.color;
            }
            return this.get_marker_color(record);
        },
        _create_marker: function (lat_lng, record) {
            var icon_url = '/web_google_maps/static/src/img/markers/';
            var options = {
                position: lat_lng,
                map: this.map,
                animation: google.maps.Animation.DROP,
                _odoo_record: record
            }
            var icon_color = this._get_icon_color(record);
            if (icon_color && MARKER_ICON_COLORS.indexOf(icon_color) !== -1) {
                options.icon = icon_url + icon_color + '.png';
            }
            var marker = new google.maps.Marker(options);
            this.markers.push(marker);
            this.cluster_add_marker(marker);
        },
        clear_markers_cluster: function () {
            this.marker_cluster.clearMarkers();
            this.markers.length = 0;
        },
        /**
         * Handle Multiple Markers present at the same coordinates
         */
        cluster_add_marker: function (marker) {
            var markerInClusters = this.marker_cluster.getMarkers();
            var existing_records = [];
            if (markerInClusters.length > 0) {
                markerInClusters.forEach(function (_cMarker) {
                    var _position = _cMarker.getPosition();
                    if (marker.getPosition().equals(_position)) {
                        existing_records.push(_cMarker._odoo_record);
                    }
                });
            }
            this.marker_cluster.addMarker(marker);
            google.maps.event.addListener(marker, 'click', this.marker_infowindow(marker, existing_records));
        },
        marker_infowindow: function (marker, current_records) {
            var self = this;
            var _content = '';
            var marker_records = [];

            var div_content = document.createElement('div');
            div_content.className = 'o_kanban_view';
            div_content.style.cssText = 'display:block;max-height:400px;overflow-y:auto;width:350px;';

            if (current_records.length > 0) {
                current_records.forEach(function (_record) {
                    _content = self.marker_infowindow_content(_record);
                    marker_records.push(_content);
                    _content.appendTo(div_content);
                });
            }

            var marker_record = self.marker_infowindow_content(marker._odoo_record);
            marker_record.appendTo(div_content);
            marker_records.push(marker_record);
            return function () {
                self.infowindow.setContent(div_content);
                self.infowindow.open(self.map, marker);
                self.postprocess_m2m_tags(marker_records);
            }
        },
        marker_infowindow_content: function (record) {
            var options = _.clone(this.record_options);
            var marker_record = new KanbanRecord(this, record, options);
            return marker_record;
        },
        postprocess_m2m_tags: function (records) {
            var self = this;
            if (!this.many2manys.length) {
                return;
            }
            var relations = {};
            records = records ? (records instanceof Array ? records : [records]) :
                this.grouped ? Array.prototype.concat.apply([], _.pluck(this.widgets, 'records')) :
                this.widgets;

            records.forEach(function (record) {
                self.many2manys.forEach(function (name) {
                    var field = record.record[name];
                    var $el = record.$('.oe_form_field.o_form_field_many2manytags[name=' + name + ']').empty();
                    // fields declared in the kanban view may not be used directly
                    // in the template declaration, for example fields for which the
                    // raw value is used -> $el[0] is undefined, leading to errors
                    // in the following process. Preventing to add push the id here
                    // prevents to make unnecessary calls to name_get
                    if (!$el[0]) {
                        return;
                    }
                    if (!relations[field.relation]) {
                        relations[field.relation] = {
                            ids: [],
                            elements: {},
                            context: self.m2m_context[name]
                        };
                    }
                    var rel = relations[field.relation];
                    field.raw_value.forEach(function (id) {
                        rel.ids.push(id);
                        if (!rel.elements[id]) {
                            rel.elements[id] = [];
                        }
                        rel.elements[id].push($el[0]);
                    });
                });
            });
            _.each(relations, function (rel, rel_name) {
                var dataset = new data.DataSetSearch(self, rel_name, self.dataset.get_context(rel.context));
                dataset.read_ids(_.uniq(rel.ids), ['name', 'color']).done(function (result) {
                    result.forEach(function (record) {
                        // Does not display the tag if color = 10
                        if (typeof record.color !== 'undefined' && record.color != 10) {
                            var $tag = $('<span>')
                                .addClass('o_tag o_tag_color_' + record.color)
                                .attr('title', _.str.escapeHTML(record.name));
                            $(rel.elements[record.id]).append($tag);
                        }
                    });
                    // we use boostrap tooltips for better and faster display
                    self.$('span.o_tag').tooltip({
                        delay: {
                            'show': 50
                        }
                    });
                });
            });
        },
        map_centered: function () {
            var context = this.dataset.context;
            if (context.route_direction) {
                this.on_init_routes();
            } else {
                this._map_centered();
            }
        },
        _map_centered: function () {
            var self = this;
            var bounds = new google.maps.LatLngBounds();
            _.each(this.markers, function (marker) {
                bounds.extend(marker.getPosition());
            });
            this.map.fitBounds(bounds);

            google.maps.event.addListenerOnce(this.map, 'idle', function () {
                google.maps.event.trigger(self.map, 'resize');
                if (self.map.getZoom() > 17) self.map.setZoom(17);
            });
        },
        do_show: function () {
            this.do_push_state({});
            this.shown.resolve();
            return this._super();
        },
        do_reload: function () {
            this.do_search(this.search_domain, this.search_context, []);
        },
        /**
         * Grouping records on maps is not supported yet
         */
        do_search: function (domain, context, group_by) {
            var self = this;
            var group_by_field = group_by[0] || this.default_group_by;
            var field = this.fields[group_by_field];
            var options = {};
            var fields_def;
            if (field === undefined) {
                fields_def = data_manager.load_fields(this.dataset).then(function (fields) {
                    self.fields = fields;
                    field = self.fields[group_by_field];
                });
            }
            var load_def = $.when(fields_def).then(function () {
                var grouped_by_m2o = field && (field.type === 'many2one');
                options = _.extend(options, {
                    search_domain: domain,
                    search_context: context,
                    group_by_field: group_by_field,
                    grouped: false,
                    grouped_by_m2o: grouped_by_m2o,
                    relation: (grouped_by_m2o ? field.relation : undefined),
                });
                return self.load_records();
            });
            return this.search_orderer
                .add(load_def)
                .then(function (data) {
                    _.extend(self, options);
                    if (options.grouped) {
                        var new_ids = _.union.apply(null, _.map(data.groups, function (group) {
                            return group.dataset.ids;
                        }));
                        self.dataset.alter_ids(new_ids);
                    }
                    self.data = data;
                })
                .then(this.proxy('render'))
                .then(this.proxy('update_pager'));
        },
        on_maps_add_controls: function () {
            this.map_layer_traffic_controls();
            this.map_layer_places_autocomplete_controls();
        },
        /**
         * On route mode
         * We will display travel mode (driving, walking, bicycling, transit) controls
         */
        map_layer_traffic_controls: function () {
            var route_mode = this.dataset.context.route_direction ? true : false;
            var map_controls = new MapControls.MapControl(this, route_mode);
            map_controls.setElement($(qweb.render('MapViewControl', {})));
            map_controls.start();
        },
        /**
         * The three keys('model', 'method', 'fields') in the object assigned to variable 'options' is a mandatory keys.
         * The idea is to be able to pass any 'object' that can be created within the map
         *
         * The fields options is divided into three parts:
         * 1) 'general'
         *     This configuration is for 'general' fields of the object, fields like name, phone, etc..
         *     On the right side of each field is an attribute(s) from 'Places autocomplete'
         * 2) 'geolocation'
         *     This configuration is for geolocation fields (only 'latitude' and 'longitude')
         *     latitude and longitude is an alias name from geolocation fields
         * 3) 'address'
         *     This configuration is similar to configuration used by 'google_places' widget
         */
        map_layer_places_autocomplete_controls: function () {
            var options = {
                model: 'res.partner',
                method: 'create_partner_from_map',
                fields: {
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
                        street: ['route', 'street_number', 'name'],
                        street2: ['administrative_area_level_3', 'administrative_area_level_4', 'administrative_area_level_5'],
                        city: ['locality', 'administrative_area_level_2'],
                        zip: 'postal_code',
                        state_id: 'administrative_area_level_1',
                        country_id: 'country'
                    }
                }
            };
            var place_autocomplete = new MapViewPlacesAutocomplete.MapPlacesAutocomplete(this, options);
            place_autocomplete.setElement($(qweb.render('MapPlacesAutomcomplete', {})));
            place_autocomplete.start();
        },
        on_init_routes: function () {
            this.directionsDisplay = new google.maps.DirectionsRenderer;
            this.directionsService = new google.maps.DirectionsService;
            this.directionsDisplay.setMap(this.map);
            this.on_calculate_and_display_route();
        },
        on_calculate_and_display_route: function (mode) {
            var self = this,
                context = this.dataset.context,
                mode = mode || 'DRIVING',
                origin = new google.maps.LatLng(context.origin_latitude, context.origin_longitude),
                destination = new google.maps.LatLng(context.destination_latitude, context.destination_longitude),
                paths = [{
                    'path': 'origin',
                    'lat_lng': origin
                }, {
                    'path': 'destination',
                    'lat_lng': destination
                }];

            // Append new control button to the map, a control to open the route in a new tab
            this.add_btn_redirection(paths);

            this.directionsService.route({
                'origin': origin,
                'destination': destination,
                travelMode: google.maps.TravelMode[mode],
                avoidHighways: false,
                avoidTolls: false
            }, function (response, status) {
                if (status === 'OK') {
                    google.maps.event.trigger(self.map, 'resize');
                    self.directionsDisplay.setDirections(response);
                    self.get_routes_distance(response.routes[0]);
                } else if (status === 'ZERO_RESULTS') {
                    self.on_add_polyline(paths);
                } else {
                    window.alert(_t('Directions request failed due to ' + status));
                }
            });
        },
        get_routes_distance: function (route) {
            var content = '';
            for (var i = 0; i < route.legs.length; i++) {
                content += '<strong>' + route.legs[i].start_address + '</strong> &#8594;';
                content += ' <strong>' + route.legs[i].end_address + '</strong>';
                content += '<p>' + route.legs[i].distance.text + '</p>';
            }
            this.on_add_routes_window(content);
        },
        on_add_routes_window: function (content) {
            if (this.$route_window == undefined) {
                this.$route_window = $(qweb.render('MapViewRoutes', {}));
                this.map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(this.$route_window[0]);
            }
            this.$route_window.find('span').html(content);
        },
        on_add_polyline: function (paths) {
            var self = this,
                context, route_path, polyline, distance, request_reverse = [],
                route = '',
                bounds;
            context = this.dataset.context,
                route_path = _.pluck(paths, 'lat_lng'),
                polyline = new google.maps.Polyline({
                    path: route_path,
                    geodesic: true,
                    strokeColor: '#3281ff',
                    strokeOpacity: 0.8,
                    strokeWeight: 5,
                    fillColor: '#FF0000',
                    fillOpacity: 0.35,
                    map: this.map
                });
            distance = this.on_compute_distance(route_path[0], route_path[1]);
            // display routes information
            _.each(paths, function (path) {
                request_reverse.push(self._on_reverse_geocoding(path));
            });
            $.when.apply($, request_reverse).done(function () {
                _.each(arguments, function (val) {
                    if (val.hasOwnProperty('origin') || val.hasOwnProperty('destination')) {
                        if (val.origin != false || val.destination != false) {
                            route += val.hasOwnProperty('origin') ? "<strong>" + val.origin + "</strong> &#8594; " : "<strong>" + val.destination + "</strong>";
                        }
                    }
                });
                route += "<p>" + distance + "</p>";
                self.on_add_routes_window(route);
            });
            // resize the map
            google.maps.event.trigger(this.map, 'resize');
            bounds = new google.maps.LatLngBounds();
            _.each(route_path, function (route) {
                bounds.extend(route);
            });
            this.map.fitBounds(bounds);
        },
        on_compute_distance: function (origin, destination) {
            var distance = google.maps.geometry.spherical.computeDistanceBetween(origin, destination);
            var to_km = (distance / 1000).toFixed(2) + " km";
            return to_km;
        },
        redirect_to_gmaps_website: function (locations) {
            var self = this,
                url = "//www.google.com/maps/dir/?api=1",
                window_reference = window.open(),
                requests = [],
                is_success;

            _.each(locations, function (path) {
                requests.push(self._on_reverse_geocoding(path));
            });
            $.when.apply($, requests).done(function () {
                is_success = true;
                _.each(arguments, function (val) {
                    if (val.hasOwnProperty('origin') || val.hasOwnProperty('destination')) {
                        if (val.origin == false || val.destination == false) {
                            is_success = false;
                            window.alert(_t('Reverse geocoding is failed!'));
                            return false;
                        } else {
                            url += val.hasOwnProperty('origin') ? "&origin=" + val.origin : "&destination=" + val.destination;
                        }
                    }
                });
                if (is_success) {
                    window_reference.location = url;
                }
            });
        },
        _on_reverse_geocoding: function (location) {
            var def = $.Deferred(),
                lat_lng, path, res = {};

            lat_lng = location['lat_lng'];
            path = location['path'];
            this.on_geocoding(lat_lng, true).done(function (result) {
                res[path] = result;
                def.resolve(res);
            }).fail(function () {
                res[path] = false;
                def.resolve(res);
            });
            return def;
        },
        on_geocoding: function (lat_lng, formatted_address) {
            var def = $.Deferred(),
                is_formatted_address;

            is_formatted_address = typeof formatted_address === "boolean" ? formatted_address : false;
            this.geocoder.geocode({
                'location': lat_lng
            }, function (results, status) {
                if (status === 'OK') {
                    if (is_formatted_address) {
                        def.resolve(results[0].formatted_address);
                    } else {
                        def.resolve(results[0]);
                    }
                } else {
                    def.reject();
                }
            });
            return def;
        },
        add_btn_redirection: function (locations) {
            var self = this;
            if (this.$btn_google_redirection === undefined) {
                this.$btn_google_redirection = $(qweb.render('MapRedirectToGoogle', {}));
                this.map.controls[google.maps.ControlPosition.RIGHT_TOP].push(this.$btn_google_redirection[0]);
                this.$btn_google_redirection.on('click', function (ev) {
                    ev.preventDefault();
                    self.redirect_to_gmaps_website(locations);
                });
            }
        },
        on_toogle_sidenav: function () {
            this.$('.o_map_sidenav').toggleClass('closed whiteframe');
            this.$('.btn_map_control').toggleClass('opened');
        },
        reload: function () {
            this.load_markers();
        },
        render_buttons: function ($node) {
            var self = this;
            this.$buttons = $('<div/>');
            var $footer = this.$('footer');
            if (this.options.action_buttons !== false || this.options.footer_to_buttons && $footer.children().length === 0) {
                this.$buttons.append(qweb.render("MapView.buttons", {
                    'widget': this
                }));
            }
            if (this.options.footer_to_buttons) {
                $footer.appendTo(this.$buttons);
            }
            this.$buttons.on('click', '.o_map_button_reload', function (ev) {
                ev.preventDefault();
                self.map_centered();
            });
            this.$buttons.appendTo($node);
        },
        add_record: function () {
            this.dataset.index = null;
            this.do_switch_view('form');
        },

        open_record: function (event, options) {
            if (this.dataset.select_id(event.data.id)) {
                this.do_switch_view('form', options);
            } else {
                this.do_warn("Kanban: could not find id#" + event.data.id);
            }
        },

        edit_record: function (event) {
            this.open_record(event, {
                mode: 'edit'
            });
        },

        delete_record: function (event) {
            var self = this;
            var record = event.data.record;

            function do_it() {
                return $.when(self.dataset.unlink([record.id])).done(function () {
                    record.destroy();
                    if (event.data.after) {
                        event.data.after();
                    }
                    self.do_reload();
                });
            }
            if (this.options.confirm_on_delete) {
                Dialog.confirm(this, _t("Are you sure you want to delete this record ?"), {
                    confirm_callback: do_it
                });
            } else {
                do_it();
            }
        },

        update_record: function (event) {
            var self = this;
            var record = event.target;
            return this.dataset.write(record.id, event.data)
                .done(function () {
                    if (!self.isDestroyed()) {
                        self.reload_record(record);
                    }
                });
        },

        open_action: function (event) {
            var self = this;
            if (event.data.context) {
                event.data.context = new data.CompoundContext(event.data.context)
                    .set_eval_context({
                        active_id: event.target.id,
                        active_ids: [event.target.id],
                        active_model: this.model,
                    });
            }
            this.do_execute_action(event.data, this.dataset, event.target.id, _.bind(self.reload_record, this, event.target));
        },

        reload_record: function (record) {
            var self = this;
            this.dataset.read_ids([record.id], this.fields_keys.concat(['__last_update'])).done(function (records) {
                if (records.length) {
                    record.update(records[0]);
                    self.postprocess_m2m_tags(record);
                } else {
                    record.destroy();
                }
            });
        },

        archive_records: function (event) {
            if (!this.has_active_field()) {
                return;
            }
            var active_value = !event.data.archive;
            var record_ids = [];
            _.each(event.target.records, function (kanban_record) {
                if (kanban_record.record.active.value != active_value) {
                    record_ids.push(kanban_record.id);
                }
            });
            if (record_ids.length) {
                this.dataset.call('write', [record_ids, {
                        active: active_value
                    }])
                    .done(this.do_reload);
            }
        },

        call_method: function (event) {
            var data = event.data;
            this.dataset.call(data.method, data.params).then(function () {
                if (data.callback) {
                    data.callback();
                }
            });
        }
    });

    // The two functions below are adopted from kanban view

    function qweb_add_if(node, condition) {
        if (node.attrs[qweb.prefix + '-if']) {
            condition = _.str.sprintf("(%s) and (%s)", node.attrs[qweb.prefix + '-if'], condition);
        }
        node.attrs[qweb.prefix + '-if'] = condition;
    }

    function transform_qweb_template(node, fvg, many2manys) {
        // Process modifiers
        if (node.tag && node.attrs.modifiers) {
            var modifiers = JSON.parse(node.attrs.modifiers || '{}');
            if (modifiers.invisible) {
                qweb_add_if(node, _.str.sprintf("!kanban_compute_domain(%s)", JSON.stringify(modifiers.invisible)));
            }
        }
        switch (node.tag) {
            case 'field':
                var ftype = fvg.fields[node.attrs.name].type;
                ftype = node.attrs.widget ? node.attrs.widget : ftype;
                if (fvg.fields[node.attrs.name].type === 'many2many') {
                    if (_.indexOf(many2manys, node.attrs.name) < 0) {
                        many2manys.push(node.attrs.name);
                    }
                    node.tag = 'div';
                    node.attrs['class'] = (node.attrs['class'] || '') + ' oe_form_field o_form_field_many2manytags o_kanban_tags';
                } else if (fields_registry.contains(ftype)) {
                    // do nothing, the kanban record will handle it
                } else {
                    node.tag = qweb.prefix;
                    node.attrs[qweb.prefix + '-esc'] = 'record.' + node.attrs.name + '.value';
                }
                break;
            case 'button':
            case 'a':
                var type = node.attrs.type || '';
                if (_.indexOf('action,object,edit,open,delete,url,set_cover'.split(','), type) !== -1) {
                    _.each(node.attrs, function (v, k) {
                        if (_.indexOf('icon,type,name,args,string,context,states,kanban_states'.split(','), k) != -1) {
                            node.attrs['data-' + k] = v;
                            delete(node.attrs[k]);
                        }
                    });
                    if (node.attrs['data-string']) {
                        node.attrs.title = node.attrs['data-string'];
                    }
                    if (node.tag == 'a' && node.attrs['data-type'] != "url") {
                        node.attrs.href = '#';
                    } else {
                        node.attrs.type = 'button';
                    }

                    var action_classes = " oe_kanban_action oe_kanban_action_" + node.tag;
                    if (node.attrs['t-attf-class']) {
                        node.attrs['t-attf-class'] += action_classes;
                    } else if (node.attrs['t-att-class']) {
                        node.attrs['t-att-class'] += " + '" + action_classes + "'";
                    } else {
                        node.attrs['class'] = (node.attrs['class'] || '') + action_classes;
                    }
                }
                break;
        }
        if (node.children) {
            for (var i = 0, ii = node.children.length; i < ii; i++) {
                transform_qweb_template(node.children[i], fvg, many2manys);
            }
        }
    }

    core.view_registry.add('map', MapView);

    return MapView;
});