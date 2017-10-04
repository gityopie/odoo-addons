odoo.define('web.MapViewPlacesAutocomplete', function (require) {
    'use strict';

    var core = require('web.core');
    var Widget = require('web.Widget');
    var Model = require('web.Model');
    var QWeb = core.qweb;
    var _lt = core._lt;
    var _t = core._t;

    var GOOGLE_PLACES_COMPONENT_FORM = {
        street_number: 'long_name',
        route: 'long_name',
        intersection: 'short_name',
        political: 'short_name',
        country: 'short_name',
        administrative_area_level_1: 'long_name',
        administrative_area_level_2: 'short_name',
        administrative_area_level_3: 'short_name',
        administrative_area_level_4: 'short_name',
        administrative_area_level_5: 'short_name',
        colloquial_area: 'short_name',
        locality: 'short_name',
        ward: 'short_name',
        sublocality_level_1: 'short_name',
        sublocality_level_2: 'short_name',
        sublocality_level_3: 'short_name',
        sublocality_level_5: 'short_name',
        neighborhood: 'short_name',
        premise: 'short_name',
        postal_code: 'short_name',
        natural_feature: 'short_name',
        airport: 'short_name',
        park: 'short_name',
        point_of_interest: 'long_name'
    };

    function odoo_prepare_values(model, field_name, value) {
        var def = $.Deferred(),
            res = {};

        if (model && value) {
            new Model(model).call('search', [['|', ['name', '=', value],['code', '=', value]]])
                .done(function (record) {
                    res[field_name] = _.first(record) || false;
                    def.resolve(res);
                });
        } else {
            res[field_name] = value;
            def.resolve(res);
        }
        return def;
    }

    function gmaps_get_geolocation(place, options) {
        var vals = {};
        _.each(options, function (alias, field) {
            if (alias === 'latitude') {
                vals[field] = place.geometry.location.lat();
            } else if (alias === 'longitude') {
                vals[field] = place.geometry.location.lng();
            }
        });
        return vals;
    }

    function gmaps_populate_places(place, place_options) {
        var values = {},
            vals;
            
        _.each(place_options, function (option, field) {
            if (option instanceof Array && !_.has(values, field)) {
                vals = _.filter(_.map(option, function (opt) {
                    return place[opt] || false;
                }));
                values[field] = _.first(vals) || "";
            } else {
                values[field] = place[option] || "";
            }
        });
        return values;
    }

    function gmaps_populate_address(place, address_options, delimiter) {
        var address_options = address_options || {},
            fields_delimiter = delimiter || {
                street: " ",
                street2: ", "
            },
            fields_to_fill = {},
            options, temp, result = {};

        // initialize object key and value
        _.each(address_options, function (value, key) {
            fields_to_fill[key] = [];
        });

        _.each(address_options, function (options, field) {
            // turn all fields options into an Array
            options = _.flatten([options]);
            temp = {};
            _.each(place.address_components, function (component) {
                _.each(_.intersection(options, component.types), function (match) {
                    temp[match] = component[GOOGLE_PLACES_COMPONENT_FORM[match]] || false;
                });
            });
            fields_to_fill[field] = _.map(options, function (item) { return temp[item]; });
        });

        _.each(fields_to_fill, function (value, key) {
            var dlmter = fields_delimiter[key] || ' ';
            if (key == 'city') {
                result[key] = _.first(_.filter(value)) || '';
            } else {
                result[key] = _.filter(value).join(dlmter);
            }
        });

        return result;
    }

    var MapPlacesAutocomplete = Widget.extend({
        events: {
            'click button#pac-button-create': 'on_create_partner',
            'click input[id^="changetype"], input[id="use-strict-bounds"]': 'on_place_changetype'
        },
        init: function (parent, options) {
            this._super.apply(this, arguments);
            this.options = _.defaults({}, options);
            this.parent = parent;
            this.place_automplete = undefined;
            this.place_marker = undefined;
            this.marker_infowindow = undefined;
        },
        on_reset_place_marker: function () {
            this.on_reset_places();
            this.marker_infowindow.close();
            this.place_marker.setVisible(false);
            this.parent.on_toogle_sidenav();
        },
        on_reset_places: function () {
            this.$('input[id="pac-input"]').val('');
            this.show_create_partner_button('hide');
        },
        _set_input_controls: function () {
            this.place_automplete = new google.maps.places.Autocomplete(this.$el.find('input#pac-input').get(0));
            this.place_automplete.bindTo('bounds', this.parent.map);
            this.on_place_changed();
        },
        start: function () {
            this.gmaps_service = new google.maps.places.PlacesService(this.parent.map);
            this._set_input_controls();
            this.parent.$el.find('.sidenav-body>#accordion').append(this.$el);
        },
        on_place_changetype: function (ev) {
            var type = $(ev.currentTarget).attr('id');
            if (type == 'changetype-all') {
                this.place_automplete.setTypes([]);
            } else if (type == 'changetype-establishment') {
                this.place_automplete.setTypes(['establishment']);
            } else if (type == 'changetype-address') {
                this.place_automplete.setTypes(['address']);
            } else if (type == 'changetype-geocode') {
                this.place_automplete.setTypes(['geocode']);
            } else if (type == 'use-strict-bounds') {
                var is_checked = $(ev.currentTarget).prop('checked');
                this.place_automplete.setOptions({
                    strictBounds: is_checked
                });
            }
        },
        on_marker_get_position: function (is_by_place) {
            var def = $.Deferred();
            var self = this;
            var by_place = is_by_place || false;
            var values = {};
            if (by_place) {
                var google_address = gmaps_populate_address(this.place, this.options.fields.address);
                var requests = [];
                _.each(this.options.fields.address, function (items, field) {
                    requests.push(self.prepare_value(field, google_address[field]));
                });
                $.when.apply($, requests).done(function () {
                    _.each(arguments, function (data, idx) {
                        _.each(data, function (val, key) {
                            if (val) {
                                values[key] = val;
                            }
                        });
                    });
                    def.resolve(values);
                });
            } else {
                this.parent.on_geocoding(this.place_marker.getPosition()).done(function (place) {
                    self.on_update_marker_infowindow(place);
                    self.on_update_pac_result(place);
                    var google_address = gmaps_populate_address(place, self.options.fields.address);
                    var requests = [];
                    _.each(self.options.fields.address, function (items, field) {
                        requests.push(self.prepare_value(field, google_address[field]));
                    });
                    $.when.apply($, requests).done(function () {
                        _.each(arguments, function (data, idx) {
                            _.each(data, function (val, key) {
                                if (val) {
                                    values[key] = val;
                                }
                            });
                        });
                        def.resolve(values);
                    });
                }).fail(function () {
                    console.log("Couldn't get marker position!");
                    def.reject();
                });
            }
            return def;
        },
        on_update_marker_infowindow: function (place) {
            if (this.marker_infowindow === undefined) {
                this.marker_infowindow = new google.maps.InfoWindow();
            }
            var $content = $(QWeb.render('MapPacMarkerContent', {
                'places': place
            }));
            this.on_set_marker_animation();
            this.marker_infowindow.setContent($content.get(0));
            this.marker_infowindow.open(this.parent.map, this.place_marker);
        },
        on_set_marker_animation: function () {
            /* FIXME: when marker is moved or user enter a new location (search a new location)
             *  the marker is stop animated
             */
            var self = this;
            window.setTimeout(function () {
                self.place_marker.setAnimation(google.maps.Animation.BOUNCE);
            }, 500);
        },
        on_place_changed: function () {
            var self = this;

            this.marker_infowindow = new google.maps.InfoWindow();
            this.marker_infowindow.setContent('<div></div>');

            if (this.place_marker === undefined) {
                this.place_marker = new google.maps.Marker({
                    map: self.parent.map,
                    draggable: true
                });
            }

            google.maps.event.addListener(this.place_marker, 'dragend', this.on_marker_get_position.bind(this, false));

            this.place_automplete.addListener('place_changed', function () {
                self.on_set_marker_animation();
                self.marker_infowindow.close();
                self.place_marker.setVisible(false);
                var place = this.getPlace();
                if (!place.geometry) {
                    // User entered the name of a Place that was not suggested and
                    // pressed the Enter key, or the Place Details request failed.
                    self.do_notify(_t("No details available for input: '" + place.name + "'"));
                    self.$('#pac-button').hide();
                    self.$('#pac-result').html('').hide();
                    return;
                }
                self.place = place;
                self.show_create_partner_button('show');
                self.on_update_pac_result(place, 'show');

                // If the place has a geometry, then present it on a map.
                if (place.geometry.viewport) {
                    self.parent.map.fitBounds(place.geometry.viewport);
                } else {
                    self.parent.map.setCenter(place.geometry.location);
                    self.parent.map.setZoom(17); // Why 17? Because it looks good.
                }

                self.place_marker.setPosition(place.geometry.location);
                self.place_marker.setVisible(true);

                self.set_marker_content(place);
            });
        },
        on_update_pac_result: function (place, action) {
            var act = action || false;
            var pac_result = QWeb.render('MapPlacesQueryResult', {
                'place': place
            });
            if (act === 'show') {
                this.$('#pac-result').html(pac_result).show();
            } else {
                this.$('#pac-result').html(pac_result);
            }
        },
        show_create_partner_button: function (show) {
            var is_show = show || 'hide';
            if (is_show == 'show') {
                this.$('#pac-button').show();
            } else {
                this.$('#pac-button').hide();
                this.$('#pac-result').html('').hide();
            }
        },
        set_marker_content: function (place) {
            var $infowindow_content = $(QWeb.render('MapPacMarkerContent', {
                'places': place
            }));
            this.marker_infowindow.setContent($infowindow_content.get(0));
            this.marker_infowindow.open(this.parent.map, this.place_marker);
        },
        set_default_values: function (place) {
            var values = {};
            if (this.options.hasOwnProperty('fields')) {
                if (this.options.fields.hasOwnProperty('general')) {
                    var places_general = gmaps_populate_places(place, this.options.fields.general);
                    _.extend(values, places_general);

                    if (values.hasOwnProperty('name')) {
                        var $input_place_name = this.$('input#place-input-name');
                        if ($input_place_name.val()) {
                            values.name = $input_place_name.val();
                        }
                    }
                }

                if (this.options.fields.hasOwnProperty('geolocation')) {
                    var places_geolocation = gmaps_get_geolocation(place, this.options.fields.geolocation);
                    _.extend(values, places_geolocation);
                }
            }

            return values;
        },
        on_create_partner: function (ev) {
            ev.preventDefault();
            var self = this;
            if (this.place && this.place.hasOwnProperty('address_components')) {
                var values = self.set_default_values(this.place);
                // check if the marker position is not equal to initial position, marker has been moved
                var is_by_place = this.place.geometry.location === this.place_marker.getPosition();
                this.on_marker_get_position(is_by_place).done(function (result) {
                    if (result) {
                        _.extend(values, result);
                        new Model(self.options.model).call(self.options.method, [values]).done(function (record) {
                            if (record) {
                                self.do_notify(_t('Successfully created new partner'));
                                // empty search results
                                self.on_reset_place_marker();
                                // reload map
                                self.parent.reload();
                            } else {
                                self.do_notify(_t('Fail to create new partner!'));
                            }
                        }).fail(function (err, event) {
                            window.alert(err);
                        });
                    } else {
                        self.do_notify(_t('Fail to create new partner!'));
                    }
                }).fail(function (err, event) {
                    self.do_notify(_t('Fail to create new partner!'));
                });
            }
        },
        prepare_value: function (field_name, value) {
            var def = $.Deferred();
            var res = {};
            if (field_name == 'state_id') {
                new Model('res.country.state')
                    .call('search', [['|', ['name', '=', value],['code', '=', value]]])
                    .done(function (record) {
                        res[field_name] = _.first(record) || false;
                        def.resolve(res);
                    });
            } else if (field_name == 'country_id') {
                new Model('res.country')
                    .call('search', [['|', ['name', '=', value], ['code', '=', value]]])
                    .done(function (record) {
                        res[field_name] = _.first(record) || false;
                        def.resolve(res);
                    });
            } else {
                res[field_name] = value;
                def.resolve(res);
            }
            return def;
        },
        destroy: function () {
            google.maps.event.clearInstanceListeners(this.place_automplete);
            this._super.apply(this, arguments);
        }
    });

    return {
        'MapPlacesAutocomplete': MapPlacesAutocomplete,
        'GOOGLE_PLACES_COMPONENT_FORM': GOOGLE_PLACES_COMPONENT_FORM,
        'gmaps_populate_address': gmaps_populate_address,
        'gmaps_populate_places': gmaps_populate_places,
        'gmaps_get_geolocation': gmaps_get_geolocation,
        'odoo_prepare_values': odoo_prepare_values
    };

});