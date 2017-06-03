odoo.define('web.MapView', function (require) {
    'use strict';

    var core = require('web.core');
    var View = require('web.View');
    var Model = require('web.DataModel');
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
            return this._super(this, arguments);
        },
        _init_start: function () {
            this.init_map();
            this.on_load_marker();
            return $.when();
        },
        on_load_marker: function () {
            var self = this;
            this.load_marker().done(function () {
                self.map_centered();
            });
        },
        load_marker: function () {
            var self = this;
            this.infowindow = new google.maps.InfoWindow();
            return $.when(this.dataset.read_slice(this.fields_list()).done(function (records) {
                self.clear_marker_clusterer();
                if (!records.length) {
                    self.do_notify(_t('No geolocation is found!'));
                    return false;
                }
                var idx_marker = 0;
                _.each(records, function (record) {
                    if (record.partner_latitude && record.partner_longitude) {
                        var latLng = new google.maps.LatLng(record.partner_latitude, record.partner_longitude);
                        var marker = new google.maps.Marker({
                            position: latLng,
                            map: self.map,
                            animation: google.maps.Animation.DROP,
                            label: record.name.slice(0, 2)
                        });
                        self.markers.push(marker);
                        self.set_markers(marker, record);
                    };
                });
            }));
        },
        clear_marker_clusterer: function () {
            this.marker_cluster.clearMarkers();
            this.markers.length = 0;
        },
        set_markers: function (marker, record) {
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
            var ignored_fields = ['id', 'partner_longitude', 'partner_latitude'];
            var contents = [];
            var title = "";
            _.each(record, function(val, key) {
                if (val && ignored_fields.indexOf(key) === -1) {
                    if (key == 'name') {
                        title = '<h3>' + val + '</h3>';
                    } else {
                        if (val instanceof Array && val.length > 0) {
                            contents.push('<dt>' + self.fields[key].string + '</dt><dd>' + val[1] + '</dd>');
                        } else {
                            contents.push('<dt>' + self.fields[key].string + '</dt><dd>' + val + '</dd>');
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
                zoom: 8,
                minZoom: 3,
                maxZoom: 20
            });
            this.marker_cluster = new MarkerClusterer(this.map, null, {
                imagePath: '/web_google_maps/static/src/img/m'
            });
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
            google.maps.event.trigger(this.map, 'resize');
            if (this.markers.length == 1) {
                google.maps.event.addListenerOnce(this.map, 'idle', function() {
                    self.map.setCenter(self.markers[0].getPosition());
                    self.map.setZoom(16);
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
            return this._super(this, arguments);
        },
        do_search: function (domain, context, group_by) {
            var self = this;
            var _super = this._super;
            var _args = arguments;
            this.shown.done(function () {
                _super.apply(self, _args);
                self.on_load_marker();
            });
        }
    });

    core.view_registry.add('map', MapView);

    return MapView;
});