odoo.define('web_google_maps.MapRenderer', function (require) {
    'use strict';

    var BasicRenderer = require('web.BasicRenderer');
    var core = require('web.core');
    var QWeb = require('web.QWeb');
    var session = require('web.session');
    var utils = require('web.utils');
    var MapRecord = require('web_google_maps.MapRecord');

    var qweb = core.qweb;

    function findInNode(node, predicate) {
        if (predicate(node)) {
            return node;
        }
        if (!node.children) {
            return undefined;
        }
        for (var i = 0; i < node.children.length; i++) {
            if (findInNode(node.children[i], predicate)) {
                return node.children[i];
            }
        }
    }

    function qwebAddIf(node, condition) {
        if (node.attrs[qweb.prefix + '-if']) {
            condition = _.str.sprintf("(%s) and (%s)", node.attrs[qweb.prefix + '-if'], condition);
        }
        node.attrs[qweb.prefix + '-if'] = condition;
    }

    function transformQwebTemplate(node, fields) {
        // Process modifiers
        if (node.tag && node.attrs.modifiers) {
            var modifiers = node.attrs.modifiers || {};
            if (modifiers.invisible) {
                qwebAddIf(node, _.str.sprintf("!map_compute_domain(%s)", JSON.stringify(modifiers.invisible)));
            }
        }
        switch (node.tag) {
            case 'button':
            case 'a':
                var type = node.attrs.type || '';
                if (_.indexOf('action,object,edit,open,delete,url,set_cover'.split(','), type) !== -1) {
                    _.each(node.attrs, function (v, k) {
                        if (_.indexOf('icon,type,name,args,string,context,states,map_states'.split(','), k) !== -1) {
                            node.attrs['data-' + k] = v;
                            delete(node.attrs[k]);
                        }
                    });
                    if (node.attrs['data-string']) {
                        node.attrs.title = node.attrs['data-string'];
                    }
                    if (node.tag === 'a' && node.attrs['data-type'] !== "url") {
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
                transformQwebTemplate(node.children[i], fields);
            }
        }
    }

    var MapRenderer = BasicRenderer.extend({
        className: 'o_map_view',
        template: 'MapView',
        /**
         * @override
         */
        init: function (parent, state, params) {
            this._super(parent, state, params);

            this.fieldLat = params.fieldLat;
            this.fieldLng = params.fieldLng;
            this.color = params.markerColor;
            this.colors = params.markerColors;
            this.iconColors = params.iconColors;
            this.iconUrl = params.iconUrl;
            this.markers = [];

            this.qweb = new QWeb(session.debug, {
                _s: session.origin
            });
            var templates = findInNode(this.arch, function (n) {
                return n.tag === 'templates';
            });
            transformQwebTemplate(templates, state.fields);
            this.qweb.add_template(utils.json_node_to_xml(templates));
            this.recordOptions = _.extend({}, params.record_options, {
                qweb: this.qweb,
                viewType: 'map',
            });
            this.state = state;
        },
        start: function () {
            this._initMap();
            return this._super.apply(this, arguments);
        },
        /**
         * Initialize map view
         */
        _initMap: function () {
            this.infoWindow = new google.maps.InfoWindow();
            this.gmap = new google.maps.Map(this.$('.o_map_view').get(0), {
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
            this.markerCluster = new MarkerClusterer(this.gmap, null, {
                imagePath: '/web_google_maps/static/src/img/m'
            });
        },
        _getIconColor: function (record) {
            if (this.color) {
                return this.color;
            }

            if (!this.colors) {
                return '';
            }

            var context = _.mapObject(_.extend({}, record.data, {
                uid: session.uid,
                current_date: moment().format('YYYY-MM-DD') // TODO: time, datetime, relativedelta
            }), function (val, key) {
                return (val instanceof Array) ? (_.last(val) || '') : val;
            });
            for (var i = 0; i < this.colors.length; i++) {
                var pair = this.colors[i];
                var color = pair[0];
                var expression = pair[1];
                if (py.PY_isTrue(py.evaluate(expression, context))) {
                    return color;
                }
                // TODO: handle evaluation errors
            }
            return '';
        },
        /**
         * Create marker
         */
        _createMarker: function (latLng, record) {
            var options = {
                position: latLng,
                map: this.gmap,
                animation: google.maps.Animation.DROP,
            };
            var color = this._getIconColor(record);
            if (color && this.iconColors.indexOf(color) !== -1) {
                options.icon = this.iconUrl + color + '-dot.png';
            }
            var marker = new google.maps.Marker(options);
            this.markers.push(marker);
            this.markerCluster.addMarker(marker);
            google.maps.event.addListener(marker, 'click', this._markerInfoWindow(marker, record));
        },
        _markerInfoWindow: function (marker, record) {
            var self = this;
            var content = this._setMarkerInfoWindow(record);
            return function () {
                self.infoWindow.setContent(content);
                self.infoWindow.open(self.gmap, marker);
            };
        },
        _setMarkerInfoWindow: function (record) {
            var el_div = document.createElement('div');
            var markerIw = new MapRecord(this, record, this.recordOptions);
            markerIw.appendTo(el_div);
            return el_div;
        },
        /**
         * Render a marker, corresponding to a record
         * @private
         * @param {Object} record
         */
        _renderMarker: function (record) {
            if (record.data[this.fieldLat] && record.data[this.fieldLng]) {
                var latLng = new google.maps.LatLng(record.data[this.fieldLat], record.data[this.fieldLng]);
                this._createMarker(latLng, record);
            }
        },
        _renderMarkers: function () {
            var self = this;
            var locs =[{lat: 59.327, lng: 18.067}, {lat: -25.363, lng:131.044}];
            _.each(locs, function(loc){
                var latLng = new google.maps.LatLng(loc.lat, loc.lng);
                var marker = new google.maps.Marker({
                    position: latLng,
                    map: self.gmap,
                    animation: google.maps.Animation.DROP,
                });
                self.markers.push(marker);
                self.markerCluster.addMarker(marker);
            });
            // return _.map(this.state.data, this._renderMarker.bind(this));
        },
        _renderView: function () {
            var self = this;
            this._clearMarkerClusters();
            this._renderMarkers();
            return this._super.apply(this, arguments).then(function() {
                return self._mapCentered();
            });
        },
        /**
         * Center map
         * @private
         */
        _mapCentered: function () {
            var self = this;
            var def = new $.Deferred();
            var bounds = new google.maps.LatLngBounds();
            if (this.markers.length === 1) {
               self.gmap.setCenter(self.markers[0].getPosition());
            } else {
                _.each(self.markers, function (marker) {
                    bounds.extend(marker.getPosition());
                });
                self.gmap.fitBounds(bounds);
            }
            def.resolve();
            return def;
        },
        _clearMarkerClusters: function () {
            this.markerCluster.clearMarkers();
            this.markers.length = 0;
        }
    });

    return MapRenderer;

});