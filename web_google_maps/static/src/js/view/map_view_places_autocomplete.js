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

    var MapPlacesAutocomplete = Widget.extend({
        init: function (parent) {
            this._super.apply(this, arguments);
            this.parent = parent;
            this.place = undefined;
            this.$el = $(QWeb.render('MapPlacesAutomcomplete', {}));
            this.model_fields = {
                'street': ['street_number', 'route'],
                'street2': ['administrative_area_level_3', 'administrative_area_level_4', 'administrative_area_level_5'],
                'city': ['locality', 'administrative_area_level_2'],
                'zip': 'postal_code',
                'state_id': 'administrative_area_level_1',
                'country_id': 'country',
            };
        },
        bind_events: function () {
            this.$el.on('click', '.btn_places_control', this.on_control_places.bind(this));
            this.$el.on('click', 'button#pac-button-create', this.create_partner.bind(this));
            this.$el.on('click', 'input[id^="changetype"]', this.on_place_changetype.bind(this));
            this.$el.on('click', 'input[id="use-strict-bounds"]', this.on_place_changetype.bind(this));
        },
        on_control_places: function (ev) {
            $(ev.currentTarget).toggleClass('opened');
            this.$el.find('.pac-card').toggleClass('opened');
            if (this.$el.find('.pac-card').hasClass('opened')) {
                this.on_show_pac_form();
            } else {
                this.$el.find('.pac-card').hide();
                this.$el.find('.fa').removeClass('fa-angle-double-left').addClass('fa-search');
            }
        },
        on_show_pac_form: function () {
            this.reset_places();
            this.$el.find('.pac-card').show();
            this.$el.find('.pac-card').show();
            this.$el.find('.fa').removeClass('fa-search').addClass('fa-angle-double-left');
            this.$el.find('input[id="pac-input"]').focus();
        },
        reset_places: function () {
            this.$el.find('input[id="pac-input"]').val('');
            this.place = undefined;
            this.show_create_partner_button('hide');
        },
        _init_form: function () {
            this.parent.map.controls[google.maps.ControlPosition.TOP_CENTER].push(this.$el[0]);
        },
        _set_input_controls: function () {
            this.bind_events();
            this.place_automplete = new google.maps.places.Autocomplete(this.$el.find('input#pac-input')[0]);
            this.place_automplete.bindTo('bounds', this.parent.map);
            this.on_place_changed();
        },
        open: function () {
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

            var infowindow = new google.maps.InfoWindow();
            var $infowindow_content = $(QWeb.render('MapPacMarkerContent', {}));

            infowindow.setContent($infowindow_content[0]);

            var marker = new google.maps.Marker({
                map: self.parent.map,
                animation: google.maps.Animation.DROP
            });

            this.place_automplete.addListener('place_changed', function () {
                infowindow.close();
                marker.setVisible(false);
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

                self.marker_format_content(place);

                // If the place has a geometry, then present it on a map.
                if (place.geometry.viewport) {
                    self.parent.map.fitBounds(place.geometry.viewport);
                } else {
                    self.parent.map.setCenter(place.geometry.location);
                    self.parent.map.setZoom(17); // Why 17? Because it looks good.
                }

                marker.setPosition(place.geometry.location);
                marker.setVisible(true);

                self.set_marker_content(place, marker, infowindow, $infowindow_content);
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
        set_marker_content: function (place, marker, infowindow, $infowindow_content) {
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
            infowindow.open(self.parent.map, marker);
        },
        marker_format_content: function (place) {
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
            this.$el.find('#pac-result').show().html(contents);
            return contents;
        },
        set_default_values: function (place) {
            var partner_values = {
                'name': place.name,
                'partner_longitude': place.geometry.location.lng(),
                'partner_latitude': place.geometry.location.lat(),
            };
            var $partner_type = this.$el.find('input[name="company_type"]:checked');
            if ($partner_type.length && $partner_type.val() == 'company') {
                partner_values['is_company'] = true;
            }
            if (place.website) {
                partner_values['website'] = place.website;
            }
            if (place.international_phone_number) {
                partner_values['phone'] = place.international_phone_number;
            }
            return partner_values;
        },
        create_partner: function (ev) {
            ev.preventDefault();
            var self = this;
            if (this.place && this.place.hasOwnProperty('address_components')) {
                var partner_values = self.set_default_values(this.place);
                var google_address = this.populate_address(this.place);
                var requests = [];
                _.each(this.model_fields, function (items, field) {
                    requests.push(self.prepare_value(field, google_address[field]));
                });
                $.when.apply($, requests).done(function () {
                    _.each(arguments, function (data, idx) {
                        _.each(data, function (val, key) {
                            partner_values[key] = val;
                        });
                    });
                    if (partner_values.street == '' && self.place.vicinity != '') {
                        partner_values.street = self.place.vicinity;
                    }
                    new Model('res.partner').call('create_partner_from_map', [partner_values]).done(function (record) {
                        if (record) {
                            window.alert(_t('Successfully created new partner.'));
                        }
                    });
                });
            }
        },
        populate_address: function (place) {
            var self = this;
            var fields_to_fill = {}
            var result = {};
            // initialize object key and value
            _.each(this.model_fields, function (value, key) {
                fields_to_fill[key] = [];
            });

            _.each(this.model_fields, function (options, key) {
                _.each(place.address_components, function (data) {
                    if (options instanceof Array && _.contains(options, data.types[0])) {
                        fields_to_fill[key].push(data[GOOGLE_PLACES_COMPONENT_FORM[data.types[0]]]);
                    } else if (options == data.types[0]) {
                        fields_to_fill[key].push(data[GOOGLE_PLACES_COMPONENT_FORM[data.types[0]]]);
                    }
                });
            });

            _.each(fields_to_fill, function (value, key) {
                result[key] = key == 'city' ? (value.length > 0 ? value[0] : false) : value.join(', ');
            });

            return result;
        },
        prepare_value: function (field_name, value) {
            var def = $.Deferred();
            var res = {};
            if (field_name == 'state_id') {
                new Model('res.country.state').call('search', [
                    ['|', ['name', '=', value],
                        ['code', '=', value]
                    ]
                ]).done(function (record) {
                    res[field_name] = record.length > 0 ? record[0] : false;
                    def.resolve(res);
                });
            } else if (field_name == 'country_id') {
                new Model('res.country').call('search', [
                    ['|', ['name', '=', value],
                        ['code', '=', value]
                    ]
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
        'GOOGLE_PLACES_COMPONENT_FORM': GOOGLE_PLACES_COMPONENT_FORM
    };

});