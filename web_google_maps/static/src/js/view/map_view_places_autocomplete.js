odoo.define('web.MapViewPlacesAutocomplete', function (require) {
    'use strict';

    var core = require('web.core');
    var Widget = require('web.Widget');
    var Model = require('web.Model');
    var QWeb = core.qweb;
    var _lt = core._lt;
    var _t = core._t;

    var GOOGLE_PLACES_COMPONENT_FORM = {
        'street_number': 'long_name',
        'route': 'long_name',
        'intersection': 'short_name',
        'political': 'short_name',
        'country': 'short_name',
        'administrative_area_level_1': 'long_name',
        'administrative_area_level_2': 'short_name',
        'administrative_area_level_3': 'short_name',
        'administrative_area_level_4': 'short_name',
        'administrative_area_level_5': 'short_name',
        'colloquial_area': 'short_name',
        'locality': 'short_name',
        'ward': 'short_name',
        'sublocality_level_1': 'short_name',
        'sublocality_level_2': 'short_name',
        'sublocality_level_3': 'short_name',
        'sublocality_level_5': 'short_name',
        'neighborhood': 'short_name',
        'premise': 'short_name',
        'postal_code': 'short_name',
        'natural_feature': 'short_name',
        'airport': 'short_name',
        'park': 'short_name',
        'point_of_interest': 'long_name'
    };

    function gmaps_populate_address(place, address_options, delimiter) {
        var address_options = address_options || {};
        var fields_delimiter = delimiter || {
            street: " ",
            street2: ", "
        };
        var fields_to_fill = {};
        var result = {};
        // initialize object key and value
        _.each(address_options, function (value, key) {
            fields_to_fill[key] = [];
        });

        _.each(address_options, function (options, field) {
            var vals = _.map(place.address_components, function (components) {
                if (options instanceof Array) {
                    var val = _.map(options, function (item) {
                        if (_.contains(components.types, item)) {
                            return components[GOOGLE_PLACES_COMPONENT_FORM[item]];
                        } else {
                            return false;
                        }
                    });
                    return _.filter(val); // eliminate false
                } else {
                    if (_.contains(components.types, options)) {
                        return components[GOOGLE_PLACES_COMPONENT_FORM[options]];
                    } else {
                        return false;
                    }
                }
            });
            fields_to_fill[field] = _.flatten(_.filter(vals, function (val) {
                return val.length;
            }));
        });

        _.each(fields_to_fill, function (value, key) {
            var dlmter = fields_delimiter.hasOwnProperty(key) ? fields_delimiter[key] : ' ';
            if (key == 'street' && !value.length) {
                var addrs = address_options.street;
                if (address_options instanceof Array) {
                    var addr = _.map(addrs, function (item) {
                        return place[item];
                    });
                    result[key] = _.filter(addr).join(dlmter);
                } else {
                    result[key] = place[addrs] || '';
                }
            } else if (key == 'city') {
                result[key] = value.length ? value[0] : '';
            } else {
                result[key] = value.join(dlmter);
            }
        });

        return result;
    }

    var MapPlacesAutocomplete = Widget.extend({
        events: {
            'click .btn_places_control': 'on_control_places',
            'click button#pac-button-create': 'on_create_partner',
            'click input[id^="changetype"], input[id="use-strict-bounds"]': 'on_place_changetype'
        },
        init: function (parent, options) {
            this._super.apply(this, arguments);
            this.options = options;
            this.parent = parent;
            this.place_automplete = undefined;
            this.place_marker = undefined;
            this.marker_infowindow = undefined;
        },
        on_control_places: function (ev) {
            $(ev.currentTarget).toggleClass('opened');
            this.$el.find('.pac-card').toggleClass('opened');
            if (this.$el.find('.pac-card').hasClass('opened')) {
                this.action_pac_form_visibility('show');
            } else {
                this.action_pac_form_visibility('hide');
            }
        },
        action_pac_form_visibility: function (action) {
            this.reset_places();
            if (action == 'show') {
                this.$el.find('.pac-card').show();
                this.$el.find('.fa').removeClass('fa-search').addClass('fa-angle-double-left');
                this.$el.find('input[id="pac-input"]').focus();
            } else {
                this.$el.find('.btn_places_control').removeClass('opened');
                this.$el.find('.pac-card').removeClass('opened').hide();
                this.$el.find('.fa').removeClass('fa-angle-double-left').addClass('fa-search');
                this.marker_infowindow.close();
                this.place_marker.setVisible(false);
            }
        },
        reset_places: function () {
            this.$el.find('input[id="pac-input"]').val('');
            this.show_create_partner_button('hide');
        },
        _init_form: function () {
            this.parent.map.controls[google.maps.ControlPosition.TOP_CENTER].push(this.$el.get(0));
        },
        _set_input_controls: function () {
            this.place_automplete = new google.maps.places.Autocomplete(this.$el.find('input#pac-input').get(0));
            this.place_automplete.bindTo('bounds', this.parent.map);
            this.on_place_changed();
        },
        start: function () {
            this._set_input_controls();
            this.parent.shown.done(this.proxy('_init_form'));
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
        on_place_changed: function () {
            var self = this;

            this.marker_infowindow = new google.maps.InfoWindow();
            var $infowindow_content = $(QWeb.render('MapPacMarkerContent', {}));

            this.marker_infowindow.setContent($infowindow_content[0]);

            this.place_marker = new google.maps.Marker({
                map: self.parent.map,
                animation: google.maps.Animation.DROP
            });

            this.place_automplete.addListener('place_changed', function () {
                self.marker_infowindow.close();
                self.place_marker.setVisible(false);
                var place = self.place_automplete.getPlace();
                if (!place.geometry) {
                    // User entered the name of a Place that was not suggested and
                    // pressed the Enter key, or the Place Details request failed.
                    window.alert(_t("No details available for input: '" + place.name + "'"));
                    self.$el.find('#pac-button').hide();
                    self.$el.find('#pac-result').html('').hide();
                    return;
                }
                self.place = place;
                self.show_create_partner_button('show');

                var marker_content = self.format_content(place);
                self.$el.find('#pac-result').show().html(marker_content);

                // If the place has a geometry, then present it on a map.
                if (place.geometry.viewport) {
                    self.parent.map.fitBounds(place.geometry.viewport);
                } else {
                    self.parent.map.setCenter(place.geometry.location);
                    self.parent.map.setZoom(17); // Why 17? Because it looks good.
                }

                self.place_marker.setPosition(place.geometry.location);
                self.place_marker.setVisible(true);

                self.set_marker_content(place, $infowindow_content);
            });
        },
        show_create_partner_button: function (show) {
            var is_show = show || 'hide';
            if (is_show == 'show') {
                this.$el.find('#pac-button').show();
            } else {
                this.$el.find('#pac-button').hide();
                this.$el.find('#pac-result').html('').hide();
            }
        },
        set_marker_content: function (place, $infowindow_content) {
            var address = '';
            if (place.address_components) {
                address = [
                    (place.address_components[0] && place.address_components[0].short_name || ''),
                    (place.address_components[1] && place.address_components[1].short_name || ''),
                    (place.address_components[2] && place.address_components[2].short_name || '')
                ].join(' ');
            }

            $infowindow_content.find('#place-icon').attr('src', place.icon);
            $infowindow_content.find('#place-name').text(place.name);
            $infowindow_content.find('#place-address').text(address);
            this.marker_infowindow.open(this.parent.map, this.place_marker);
        },
        format_content: function (place) {
            var contents = '<h3>' + place.name + '</h3>';
            if (place.formatted_address) {
                contents += '<div id="formatted_address"><strong>Address: </strong>' + place.formatted_address + '</div>';
            }
            if (place.international_phone_number) {
                contents += '<div id="international_phone_number"><strong> Phone</strong>: ' + place.international_phone_number + '</div>';
            }
            if (place.website) {
                contents += '<div id="website"><strong>Website</strong>: ' + place.website + '</div>';
            }
            return contents;
        },
        set_default_values: function (place) {
            var self = this;
            var values = {};
            _.each(this.options.fields, function (attrs, type) {
                if (type === 'general') {
                    _.each(attrs, function (option, field) {
                        if (option instanceof Array && !_.has(values, field)) {
                            var val = _.first(_.map(option, function (opt) {
                                return place[opt];
                            }));
                            if (val) {
                                values[field] = val;
                            }
                        } else if (field == 'is_company') {
                            var $partner_type = self.$el.find('input[name="company_type"]:checked');
                            if ($partner_type.length && $partner_type.val() == 'company') {
                                values[field] = true;
                            }
                        } else {
                            values[field] = place[option];
                        }
                    });
                } else if (type === 'geolocation') {
                    var geolocation = self.get_geolocation(place, attrs);
                    _.extend(values, geolocation);
                }
            });
            return values;
        },
        get_geolocation: function (place, options) {
            var vals = {};
            _.each(options, function (field, alias) {
                if (alias === 'latitude') {
                    vals[field] = place.geometry.location.lat();
                } else if (alias === 'longitude') {
                    vals[field] = place.geometry.location.lng();
                }
            });
            return vals;
        },
        on_create_partner: function (ev) {
            ev.preventDefault();
            var self = this;
            if (this.place && this.place.hasOwnProperty('address_components')) {
                var values = self.set_default_values(this.place);
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
                    new Model(self.options.model).call(self.options.method, [values]).done(function (record) {
                        if (record) {
                            window.alert(_t('Successfully created new partner'));
                            // empty search results
                            self.action_pac_form_visibility('hide');
                            // reload map
                            self.parent.reload();
                        } else {
                            window.alert(_t('Fail to create new partner!'));
                        }
                    }).fail(function (err, event) {
                        window.alert(err);
                    });
                });
            }
        },
        prepare_value: function (field_name, value) {
            var def = $.Deferred();
            var res = {};
            if (field_name == 'state_id') {
                new Model('res.country.state').call('search', [
                    ['|', ['name', '=', value], ['code', '=', value]]
                ]).done(function (record) {
                    res[field_name] = record.length > 0 ? record[0] : false;
                    def.resolve(res);
                });
            } else if (field_name == 'country_id') {
                new Model('res.country').call('search', [
                    ['|', ['name', '=', value], ['code', '=', value]]
                ]).done(function (record) {
                    res[field_name] = record.length > 0 ? record[0] : false;
                    def.resolve(res);
                });
            } else {
                res[field_name] = value;
                def.resolve(res);
            }
            return def;
        },
    });

    return {
        'MapPlacesAutocomplete': MapPlacesAutocomplete,
        'GOOGLE_PLACES_COMPONENT_FORM': GOOGLE_PLACES_COMPONENT_FORM,
        'gmaps_populate_address': gmaps_populate_address
    };

});