odoo.define('web_google_maps.MapsControls', function (require) {
    'use strict';

    var core = require('web.core');
    var Widget = require('web.Widget');

    var qweb = core.qweb;

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

    return {
        MapControl: MapControl,
        MapControlLayer: MapControlLayer,
        MapControlTravelMode: MapControlTravelMode
    };

});