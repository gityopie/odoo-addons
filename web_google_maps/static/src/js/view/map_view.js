odoo.define('web.MapView', function (require) {
    'use strict';

    var core = require('web.core');
    var ajax = require('web.ajax');
    var View = require('web.View');
    var pyeval = require('web.pyeval');
    var session = require('web.session');
    var Widget = require('web.Widget');
    var Model = require('web.Model');
    var QWeb = require('web.QWeb');
    var utils = require('web.utils');

    var MapViewPlacesAutocomplete = require('web.MapViewPlacesAutocomplete');
    var MapRecord = require('web_google_maps.Record');

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
        className: 'o_map',
        display_name: _lt('Map'),
        defaults: _.extend(View.prototype.defaults, {
            // records can be selected one by one
            selectable: true,
            // whether the column headers should be displayed
            header: true,
            action_buttons: true,
            searchable: true,
        }),
        icon: 'fa-map-o',
        mobile_friendly: true,
        custom_events: {
            'map_record_open': 'switch_form_view'
        },
        init: function () {
            this._super.apply(this, arguments);
            this.qweb = new QWeb(session.debug, {
                _s: session.origin
            });
            this.markers = [];
            this.map = false;
            this.shown = $.Deferred();
            this.fields = this.fields_view.fields;
            this.children_field = this.fields_view.field_parent;
            this.geocoder = new google.maps.Geocoder;
            // Retrieve many2manys stored in the fields_view if it has already been processed
            this.many2manys = this.fields_view.many2manys || [];
            this.m2m_context = {};
        },
        start: function () {
            var self = this;
            this.record_options = {
                editable: false,
                deletable: false,
                fields: this.fields_view.fields,
                qweb: this.qweb,
                model: this.model,
                read_only_mode: this.options.read_only_mode,
            };
            this.shown.done(this.proxy('_init_start'));
            return this._super();
        },
        _init_start: function () {
            this.init_map();
            this.on_load_markers();
            return $.when();
        },
        willStart: function () {
            this.set_geolocation_fields();
            this.set_marker_title();
            this.set_marker_colors();
            this.get_marker_iw_template();
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
        set_marker_title: function () {
            if (this.fields_view.arch.attrs.title) {
                var title = this.fields_view.arch.attrs.title;
                if (!this.fields.hasOwnProperty(title)) {
                    this.do_warn(_t('Map View Attributes'), _t('The field for marker title needs to be loaded into view!'));
                }
                this.marker_title = title;
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
        on_load_markers: function () {
            var self = this;
            this.load_markers().done(function () {
                self.map_centered();
            });
        },
        load_markers: function () {
            var self = this,
                latLng;

            this.infowindow = new google.maps.InfoWindow();
            return $.when(this.dataset.read_slice(this.fields_list()).done(function (records) {
                self.clear_marker_clusterer();
                if (!records.length) {
                    self.do_notify(_t('No geolocation is found!'));
                    return false;
                }
                _.each(records, function (record) {
                    if (record[self.latitude] && record[self.longitude]) {
                        latLng = new google.maps.LatLng(record[self.latitude], record[self.longitude]);
                        self._create_marker(latLng, record);
                    };
                });
            }));
        },
        _get_icon_color: function (record) {
            if (this.color) {
                return this.color;
            }
            return this.get_marker_color(record);
        },
        _create_marker: function (lat_lng, record) {
            var options = '',
                icon_url = '/web_google_maps/static/src/img/markers/',
                icon_color = '',
                marker = '';

            options = {
                position: lat_lng,
                map: this.map,
                animation: google.maps.Animation.DROP
            }
            icon_color = this._get_icon_color(record);
            if (icon_color && MARKER_ICON_COLORS.indexOf(icon_color) !== -1) {
                options.icon = icon_url + icon_color + '.png';
            }
            marker = new google.maps.Marker(options);
            this.markers.push(marker);
            this.set_marker(marker, record);
        },
        clear_marker_clusterer: function () {
            this.marker_cluster.clearMarkers();
            this.markers.length = 0;
        },
        set_marker: function (marker, record) {
            this.marker_cluster.addMarker(marker);
            google.maps.event.addListener(marker, 'click', this.marker_infowindow(marker, record));
        },
        marker_infowindow: function (marker, record) {
            var self = this;
            var content = self.marker_infowindow_content(record);
            return function () {
                self.infowindow.setContent(content);
                self.infowindow.open(self.map, marker);
            }
        },
        marker_infowindow_content: function (record) {
            var element, options, marker_record;
            element = document.createElement('div');
            options = _.clone(this.record_options);
            marker_record = new MapRecord(this, record, options);
            marker_record.appendTo(element);
            return element;
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
                imagePath: '/web_google_maps/static/src/img/m'
            });
            this.on_maps_add_controls();
        },
        fields_list: function () {
            var fields = _.keys(this.fields);
            if (!_(fields).contains(this.children_field)) {
                fields.push(this.children_field);
            }
            return _.filter(fields);
        },
        map_centered: function () {
            var self = this,
                context = this.dataset.context;

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
            return this._super.apply(this, arguments);
        },
        do_search: function (domain, context, group_by) {
            var self = this,
                _super = this._super,
                _args = arguments;

            this.shown.done(function () {
                _super.apply(self, _args);
                self.on_load_markers();
            });
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
            var map_controls = new MapControl(this, route_mode);
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
            var content = "",
                i;
            for (i = 0; i < route.legs.length; i++) {
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
            var self = this;
            setTimeout(function () {
                self.on_load_markers();
            }, 1000);
            return $.when();
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
                self.on_load_markers();
            });
            this.$buttons.appendTo($node);
        },
        switch_form_view: function (event, options) {
            if (this.dataset.select_id(event.data.id)) {
                this.do_switch_view('form', options);
            } else {
                this.do_warn("Map: could not find id#" + event.data.id);
            }
        }
    });

    var MapControl = Widget.extend({
        events: {
            'click .btn_map_control': 'on_control_maps'
        },
        init: function (parent, route) {
            this._super.apply(this, arguments);
            this.parent = parent;
            this.route = route;
        },
        _init_controls: function () {
            this.parent.map.controls[google.maps.ControlPosition.LEFT_TOP].push(this.$el.get(0));
        },
        start: function () {
            var self = this;

            this.parent.shown.done(this.proxy('_init_controls'));

            var map_layers = new MapControlLayer(this.parent);
            map_layers.setElement($(qweb.render('MapControlLayers', {})));
            map_layers.start();

            if (this.route) {
                var map_routes = new MapControlTravelMode(this.parent);
                map_routes.setElement($(qweb.render('MapControlTravelMode', {})));
                map_routes.start();
            }
        },
        on_control_maps: function () {
            this.parent.on_toogle_sidenav();
        }
    });

    var MapControlLayer = Widget.extend({
        events: {
            'click #map_layer': 'on_change_layer',
        },
        init: function (parent) {
            this._super.apply(this, arguments);
            this.parent = parent;
        },
        start: function () {
            this.parent.$('.sidenav-body>#accordion').append(this.$el);
        },
        on_change_layer: function (ev) {
            ev.preventDefault();
            var layer = $(ev.currentTarget).data('layer');
            if (layer == 'traffic') {
                this._on_traffic_layer(ev);
            } else if (layer == 'transit') {
                this._on_transit_layer(ev);
            } else if (layer == 'bicycle') {
                this._on_bicycle_layer(ev);
            }
        },
        _on_traffic_layer: function (ev) {
            $(ev.currentTarget).toggleClass('active');
            if ($(ev.currentTarget).hasClass('active')) {
                this.trafficLayer = new google.maps.TrafficLayer();
                this.trafficLayer.setMap(this.parent.map);
            } else {
                this.trafficLayer.setMap(null);
            }
        },
        _on_transit_layer: function (ev) {
            $(ev.currentTarget).toggleClass('active');
            if ($(ev.currentTarget).hasClass('active')) {
                this.transitLayer = new google.maps.TransitLayer();
                this.transitLayer.setMap(this.parent.map);
            } else {
                this.transitLayer.setMap(null);
            }
        },
        _on_bicycle_layer: function (ev) {
            $(ev.currentTarget).toggleClass('active');
            if ($(ev.currentTarget).hasClass('active')) {
                this.bikeLayer = new google.maps.BicyclingLayer();
                this.bikeLayer.setMap(this.parent.map);
            } else {
                this.bikeLayer.setMap(null);
            }
        },
        destroy: function () {
            if (this.transitLayer) {
                this.transitLayer.setMap(null);
            }

            if (this.bikeLayer) {
                this.bikeLayer.setMap(null);
            }

            if (this.trafficLayer) {
                this.trafficLayer.setMap(null);
            }

            this._super.apply(this, arguments);
        }

    });

    var MapControlTravelMode = Widget.extend({
        events: {
            'click #travel_mode': 'on_change_mode'
        },
        init: function (parent) {
            this._super.apply(this, arguments);
            this.parent = parent;
        },
        start: function () {
            this.parent.$('.sidenav-body > #accordion').append(this.$el);
        },
        on_change_mode: function (ev) {
            ev.preventDefault();
            $(ev.currentTarget).siblings().removeClass('active');
            $(ev.currentTarget).toggleClass('active');
            var mode = $(ev.currentTarget).data('mode');
            this.parent.on_calculate_and_display_route(mode);
        },
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
                qweb_add_if(node, _.str.sprintf("!map_compute_domain(%s)", JSON.stringify(modifiers.invisible)));
            }
        }
        switch (node.tag) {
            case 'field':
                var ftype = fvg.fields[node.attrs.name].type;
                ftype = node.attrs.widget ? node.attrs.widget : ftype;
                if (ftype === 'many2many') {
                    if (_.indexOf(many2manys, node.attrs.name) < 0) {
                        many2manys.push(node.attrs.name);
                    }
                    node.tag = 'div';
                    node.attrs['class'] = (node.attrs['class'] || '') + ' oe_form_field o_form_field_many2manytags o_map_tags';
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
                if (_.indexOf('action,object,edit,open,delete,url'.split(','), type) !== -1) {
                    _.each(node.attrs, function (v, k) {
                        if (_.indexOf('icon,type,name,args,string,context,states'.split(','), k) != -1) {
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

                    var action_classes = " oe_map_action oe_map_action_" + node.tag;
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