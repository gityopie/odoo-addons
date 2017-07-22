odoo.define('web.MapView', function (require) {
    'use strict';

    var core = require('web.core');
    var View = require('web.View');
    var Widget = require('web.Widget');
    var Model = require('web.Model');
    var MapViewPlacesAutocomplete = require('web.MapViewPlacesAutocomplete');
    var QWeb = core.qweb;
    var _lt = core._lt;
    var _t = core._t;

    var MapView = View.extend({
        template: 'MapView',
        className: 'o_map_view',
        display_name: _lt('Map'),
        icon: 'fa-map-o',
        searchable: true,
        init: function () {
            this._super.apply(this, arguments);
            this.markers = [];
            this.map = false;
            this.shown = $.Deferred();
            this.fields = this.fields_view.fields;
            this.children_field = this.fields_view.field_parent;
        },
        start: function () {
            var self = this;
            this.shown.done(this.proxy('_init_start'));
            return this._super.apply(this, arguments);
        },
        _init_start: function () {
            this.init_map();
            this.on_load_markers();
            return $.when();
        },
        willStart: function () {
            this.set_geolocation_fields();
            return this._super.apply(this, arguments);
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
        on_load_markers: function () {
            var self = this;
            this.load_markers().done(function () {
                self.map_centered();
            });
        },
        load_markers: function () {
            var self = this;
            this.infowindow = new google.maps.InfoWindow();
            return $.when(this.dataset.read_slice(this.fields_list()).done(function (records) {
                self.clear_marker_clusterer();
                if (!records.length) {
                    self.do_notify(_t('No geolocation is found!'));
                    return false;
                }
                _.each(records, function (record) {
                    if (record[self.latitude] && record[self.longitude]) {
                        var latLng = new google.maps.LatLng(record[self.latitude], record[self.longitude]);
                        self._create_marker(latLng, record);
                    };
                });
            }));
        },
        _create_marker: function (lat_lng, record) {
            var record = record || {
                'name': 'XY'
            };
            var marker = new google.maps.Marker({
                position: lat_lng,
                map: this.map,
                animation: google.maps.Animation.DROP,
                label: record.name.slice(0, 2)
            });
            this.markers.push(marker);
            this.set_marker(marker, record);
        },
        clear_marker_clusterer: function () {
            this.marker_cluster.clearMarkers();
            this.markers.length = 0;
        },
        set_marker: function (marker, record) {
            var record = record || false;
            this.marker_cluster.addMarker(marker);
            google.maps.event.addListener(marker, 'click', this.marker_infowindow(marker, record));
        },
        marker_infowindow: function (marker, record) {
            if (!Object.keys(record).length) {
                return;
            }
            var self = this;
            var content = this.marker_infowindow_content(record);
            return function () {
                self.infowindow.setContent(content);
                self.infowindow.open(self.map, marker);
            }
        },
        marker_infowindow_content: function (record) {
            var self = this;
            var ignored_fields = ['id', this.latitude, this.longitude];
            var contents = [];
            var title = "";
            _.each(record, function (val, key) {
                if (val && ignored_fields.indexOf(key) === -1) {
                    if (key == 'name') {
                        title += '<h3>' + val + '</h3>';
                    } else {
                        if (val instanceof Array && val.length > 0) {
                            contents.push('<p><strong>' + self.fields[key].string + '</strong> : <span>' + val[1] + '</span></p>');
                        } else {
                            contents.push('<p><strong>' + self.fields[key].string + '</strong> : <span>' + val + '</span></p>');
                        }
                    }
                }
            });
            var res = '<div>' + title + '<dl>' + contents.join('') + '</dl></div>';
            return res;
        },
        init_map: function () {
            this.map = new google.maps.Map(this.$el[0], {
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                zoom: 3,
                minZoom: 3,
                maxZoom: 20,
                fullscreenControl: true,
                mapTypeControl: true,
                mapTypeControlOptions: {
                    style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                    position: google.maps.ControlPosition.TOP_CENTER
                }
            });
            this.marker_cluster = new MarkerClusterer(this.map, null, {
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
            var self = this;
            var context = this.dataset.context;
            if (context.route_direction) {
                this.on_init_routes();
            } else {
                this._map_centered();
            }
        },
        _map_centered: function () {
            google.maps.event.trigger(this.map, 'resize');
            if (this.markers.length == 1) {
                var self = this;
                google.maps.event.addListenerOnce(this.map, 'idle', function () {
                    self.map.setCenter(self.markers[0].getPosition());
                    self.map.setZoom(17);
                });
            } else {
                var bounds = new google.maps.LatLngBounds();
                _.each(this.markers, function (marker) {
                    bounds.extend(marker.getPosition());
                });
                this.map.fitBounds(bounds);
            }
        },
        do_show: function () {
            this.do_push_state({});
            this.shown.resolve();
            return this._super.apply(this, arguments);
        },
        do_search: function (domain, context, group_by) {
            var self = this;
            var _super = this._super;
            var _args = arguments;
            this.shown.done(function () {
                _super.apply(self, _args);
                self.on_load_markers();
            });
        },
        on_maps_add_controls: function () {
            var route_mode = this.dataset.context.route_direction ? true : false;
            new MapControl(this).open(route_mode);
            new MapViewPlacesAutocomplete.MapPlacesAutocomplete(this).open();
        },
        on_init_routes: function () {
            this.geocoder = new google.maps.Geocoder;
            this.directionsDisplay = new google.maps.DirectionsRenderer;
            this.directionsService = new google.maps.DirectionsService;
            this.directionsDisplay.setMap(this.map);
            this.on_calculate_and_display_route();
        },
        on_calculate_and_display_route: function (mode) {
            var self = this;
            var context = this.dataset.context;
            var mode = mode || 'DRIVING';
            var origin = new google.maps.LatLng(context.origin_latitude, context.origin_longitude);
            var destination = new google.maps.LatLng(context.destination_latitude, context.destination_longitude);
            var paths = [{
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
            var content = "";
            for (var i = 0; i < route.legs.length; i++) {
                content += '<strong>' + route.legs[i].start_address + '</strong> &#8594;';
                content += ' <strong>' + route.legs[i].end_address + '</strong>';
                content += '<p>' + route.legs[i].distance.text + '</p>';
            }
            this.on_add_routes_window(content);
        },
        on_add_routes_window: function (content) {
            if (this.$route_window == undefined) {
                this.$route_window = $(QWeb.render('MapViewRoutes', {}));
                this.map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(this.$route_window[0]);
            }
            this.$route_window.find('span').html(content);
        },
        on_add_polyline: function (paths) {
            var self = this;
            var context = this.dataset.context;
            var route_path = _.pluck(paths, 'lat_lng');
            var polyline = new google.maps.Polyline({
                path: route_path,
                geodesic: true,
                strokeColor: '#3281ff',
                strokeOpacity: 0.8,
                strokeWeight: 5,
                fillColor: '#FF0000',
                fillOpacity: 0.35,
                map: this.map
            });
            var distance = this.on_compute_distance(route_path[0], route_path[1]);
            // display routes information
            var request_reverse = [];
            _.each(paths, function (path) {
                request_reverse.push(self._on_reverse_geocoding(path));
            });
            $.when.apply($, request_reverse).done(function () {
                var route = "";
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
            var bounds = new google.maps.LatLngBounds();
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
            var self = this;
            var url = "https://www.google.com/maps/dir/?api=1";
            var window_reference = window.open();
            var requests = [];
            _.each(locations, function (path) {
                requests.push(self._on_reverse_geocoding(path));
            });
            $.when.apply($, requests).done(function () {
                var is_success = true;
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
            var def = $.Deferred();
            var lat_lng = location['lat_lng'];
            var path = location['path'];
            var res = {};
            this.geocoder.geocode({
                'location': lat_lng
            }, function (results, status) {
                if (status === 'OK') {
                    res[path] = results[0].formatted_address;
                } else {
                    res[path] = false;
                }
                def.resolve(res);
            });
            return def;
        },
        add_btn_redirection: function (locations) {
            var self = this;
            if (this.$btn_google_redirection === undefined) {
                this.$btn_google_redirection = $(QWeb.render('MapRedirectToGoogle', {}));
                this.map.controls[google.maps.ControlPosition.RIGHT_TOP].push(this.$btn_google_redirection[0]);
                this.$btn_google_redirection.on('click', function (ev) {
                    ev.preventDefault();
                    self.redirect_to_gmaps_website(locations);
                });
            }
        }
    });

    var MapControl = Widget.extend({
        init: function (parent) {
            this._super.apply(parent, {});
            this.parent = parent;
            this.$controls = $(QWeb.render('MapViewControl', {}));
        },
        bind_events: function () {
            this.$controls.on('mouseenter', '.btn_map_control', this.on_control_maps.bind(this));
            this.$controls.on('click', 'p#map_layer', this.on_change_layer.bind(this));
            this.$controls.on('click', 'p#travel_mode', this.on_change_mode.bind(this));
        },
        _init_controls: function () {
            this.bind_events();
            this.parent.map.controls[google.maps.ControlPosition.LEFT_TOP].push(this.$controls[0]);
        },
        open: function (route_mode) {
            if (route_mode) {
                this.$controls.find('#o_map_travel_mode').show();
            }
            this.parent.shown.done(this.proxy('_init_controls'));
        },
        on_control_maps: function (ev) {
            $(ev.currentTarget).toggleClass('opened');
            this.$controls.find('#o_map_sidenav').toggleClass('opened');
            if (this.$controls.find('#o_map_sidenav').hasClass('opened')) {
                this.$controls.find('#o_map_sidenav').css({
                    'width': '150px'
                }).show();
                this.$controls.find('.fa').removeClass('fa-bars').addClass('fa-angle-double-left');
            } else {
                this.$controls.find('#o_map_sidenav').hide();
                this.$controls.find('.fa').removeClass('fa-angle-double-left').addClass('fa-bars');
            }
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
        on_change_mode: function (ev) {
            ev.preventDefault();
            $(ev.currentTarget).siblings().removeClass('active');
            $(ev.currentTarget).toggleClass('active')
            var mode = $(ev.currentTarget).data('mode');
            this.parent.on_calculate_and_display_route(mode);
        },
        _on_traffic_layer: function (ev) {
            $(ev.currentTarget).toggleClass('active');
            if ($(ev.currentTarget).hasClass('active')) {
                this.trafficLayer = new google.maps.TrafficLayer();
                this.trafficLayer.setMap(this.parent.map);
            } else {
                this.trafficLayer.setMap(null);
                this.trafficLayer = undefined;
            }
        },
        _on_transit_layer: function (ev) {
            $(ev.currentTarget).toggleClass('active');
            if ($(ev.currentTarget).hasClass('active')) {
                this.transitLayer = new google.maps.TransitLayer();
                this.transitLayer.setMap(this.parent.map);
            } else {
                this.transitLayer.setMap(null);
                this.transitLayer = undefined;
            }
        },
        _on_bicycle_layer: function (ev) {
            $(ev.currentTarget).toggleClass('active');
            if ($(ev.currentTarget).hasClass('active')) {
                this.bikeLayer = new google.maps.BicyclingLayer();
                this.bikeLayer.setMap(this.parent.map);
            } else {
                this.bikeLayer.setMap(null);
                this.bikeLayer = undefined;
            }
        }
    });

    core.view_registry.add('map', MapView);

    return MapView;
});