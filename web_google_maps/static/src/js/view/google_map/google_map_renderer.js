odoo.define('web_google_maps.GoogleMapRenderer', function (require) {
    'use strict';

    const BasicRenderer = require('web.BasicRenderer');
    const core = require('web.core');
    const QWeb = require('web.QWeb');
    const session = require('web.session');
    const utils = require('web.utils');
    const KanbanRecord = require('web.KanbanRecord');
    const GoogleMapUtils = require('web_google_maps.Utils');
    const GoogleMapSidebar = require('web_google_maps.GoogleMapSidebar');
    const GoogleMapLoaderUtil = require('web_google_maps.GoogleMapLoaderUtil');
    const FontAwesomeSVG = require('web_google_maps.FontAwesomeSVG');

    const qweb = core.qweb;
    const _lt = core._lt;

    const GoogleMapRecord = KanbanRecord.extend({
        init: function (parent, state, options) {
            this._super.apply(this, arguments);
            this.fieldsInfo = state.fieldsInfo.google_map;
        },
        _render: function () {
            this.defs = [];

            this._replaceElement(this.qweb.render('kanban-box', this.qweb_context));
            this.$el.addClass('o_kanban_record').attr('tabindex', 0);
            this.$el.attr('role', 'article');
            this.$el.data('record', this);

            this._processFields();
            this._processWidgets();

            return Promise.all(this.defs);
        },
    });

    function findInNode(node, predicate) {
        if (predicate(node)) {
            return node;
        }
        if (!node.children) {
            return undefined;
        }
        for (let i = 0; i < node.children.length; i++) {
            if (findInNode(node.children[i], predicate)) {
                return node.children[i];
            }
        }
    }

    function qwebAddIf(node, condition) {
        if (node.attrs[qweb.prefix + '-if']) {
            condition = _.str.sprintf('(%s) and (%s)', node.attrs[qweb.prefix + '-if'], condition);
        }
        node.attrs[qweb.prefix + '-if'] = condition;
    }

    function transformQwebTemplate(node, fields) {
        // Process modifiers
        if (node.tag && node.attrs.modifiers) {
            const modifiers = node.attrs.modifiers || {};
            if (modifiers.invisible) {
                qwebAddIf(node, _.str.sprintf('!kanban_compute_domain(%s)', JSON.stringify(modifiers.invisible)));
            }
        }
        switch (node.tag) {
            case 'button':
            case 'a':
                const type = node.attrs.type || '';
                if (_.indexOf('action,object,edit,open,delete,url,set_cover'.split(','), type) !== -1) {
                    _.each(node.attrs, function (v, k) {
                        if (_.indexOf('icon,type,name,args,string,context,states,kanban_states'.split(','), k) !== -1) {
                            node.attrs['data-' + k] = v;
                            delete node.attrs[k];
                        }
                    });
                    if (node.attrs['data-string']) {
                        node.attrs.title = node.attrs['data-string'];
                    }
                    if (node.tag === 'a' && node.attrs['data-type'] !== 'url') {
                        node.attrs.href = '#';
                    } else {
                        node.attrs.type = 'button';
                    }

                    const action_classes = ' oe_kanban_action oe_kanban_action_' + node.tag;
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
            for (let i = 0, ii = node.children.length; i < ii; i++) {
                transformQwebTemplate(node.children[i], fields);
            }
        }
    }

    const GoogleMapRenderer = BasicRenderer.extend(GoogleMapLoaderUtil, {
        className: 'o_google_map_view',
        template: 'GoogleMapView.MapView',
        events: _.extend({}, BasicRenderer.prototype.events, {
            'click .toggle_right_sidenav': 'onToggleRightSidenav',
        }),
        onToggleRightSidenav: function () {
            this.$('.o_map_right_sidebar').toggleClass('closed').toggleClass('open');
            this.$('.o_map_right_sidebar').find('.toggle_right_sidenav > button').toggleClass('closed');
            if (this.$('.o_map_right_sidebar').hasClass('closed') && this.gmap) {
                const current_center = this.gmap.getCenter();
                google.maps.event.trigger(this.gmap, 'resize');
                this.gmap.setCenter(current_center);
            }
        },
        /**
         * @override
         *
         * @param {*} parent
         * @param {*} state
         * @param {*} params
         */
        init: function (parent, state, params) {
            this._super.apply(this, arguments);
            this.viewTitle = params.arch.attrs.string || 'Google Maps';
            this.widgets = [];
            this.context = params.context;

            this.qweb = new QWeb(
                session.debug,
                {
                    _s: session.origin,
                },
                false
            );
            const templates = findInNode(this.arch, function (n) {
                return n.tag === 'templates';
            });
            transformQwebTemplate(templates, state.fields);
            this.qweb.add_template(utils.json_node_to_xml(templates));
            this.recordOptions = _.extend({}, params.record_options, {
                qweb: this.qweb,
                viewType: 'google_map',
            });
            this.state = state;
            this.mapMode = params.map_mode ? params.map_mode : 'geometry';
            this.gestureHandling =
                ['cooperative', 'greedy', 'none', 'auto'].indexOf(params.gestureHandling) === -1
                    ? 'auto'
                    : params.gestureHandling;
            this._initLibraryProperties(params);
        },
        /**
         *
         * @param {*} params
         */
        _initLibraryProperties: function (params) {
            const func_name = 'set_property_' + this.mapMode;
            this[func_name].call(this, params);
        },
        /**
         *
         * @param {*} params
         */
        set_property_geometry: function (params) {
            this.defaultMarkerColor = 'red';
            this.markers = [];
            this.fieldLat = params.fieldLat;
            this.fieldLng = params.fieldLng;
            this.markerColor = params.markerColor;
            this.markerColors = params.markerColors;
            this.markerClusterConfig = params.markerClusterConfig;
            this.disableClusterMarker = params.disableClusterMarker;
            this.sidebarRender = null;
            this.googleMapStyle = params.googleMapStyle;
            this.sidebarTitle = params.sidebarTitle;
            this.sidebarSubtitle = params.sidebarSubtitle;
            this.disableNavigation = params.disableNavigation;
            this.markerIcon = params.markerIcon;
            this.markerIcons = params.markerIcons;
            this.markerIconScale = params.markerIconScale;
        },
        /**
         * @private
         * @param {string} style
         * @returns
         */
        _setMapTheme: function (style) {
            const themes = GoogleMapUtils.MAP_THEMES;
            if (!Object.prototype.hasOwnProperty.call(themes, style) || style === 'default') {
                return;
            }
            const styledMapType = new google.maps.StyledMapType(themes[style], {
                name: _lt('Styled Map'),
            });
            this.gmap.setOptions({
                mapTypeControlOptions: {
                    mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain', 'styled_map'],
                },
            });
            // Associate the styled map with the MapTypeId and set it to display.
            if (style === 'default') return;
            this.gmap.mapTypes.set('styled_map', styledMapType);
            this.gmap.setMapTypeId('styled_map');
        },
        /**
         * Style the map
         */
        setMapTheme: async function () {
            if (this.googleMapStyle) {
                this._setMapTheme(this.googleMapStyle);
            } else if (this.loaderOptions && this.loaderOptions.theme) {
                this._setMapTheme(this.loaderOptions.theme);
            }
        },
        /**
         * Initialize map
         * @private
         */
        _initMap: function () {
            if (!this.gmap) {
                this.gmap = new google.maps.Map(this.$('.o_google_map_view').get(0), {
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    minZoom: 2,
                    maxZoom: 20,
                    fullscreenControl: true,
                    mapTypeControl: true,
                    gestureHandling: this.gestureHandling,
                });
                this.setMapTheme();
                const func_name = '_post_load_map_' + this.mapMode;
                this[func_name].call(this);
            }
            this.infoWindow = new google.maps.InfoWindow();
            if (!this.$right_sidebar) {
                this.$right_sidebar = this.$('.o_map_right_sidebar');
            }
        },
        /**
         * Handle button geolocate user location
         */
        _post_load_map_geometry: function () {
            const $btn_geolocate_user = $(qweb.render('GoogleMapView.GeolocateUser', { widget: this }));
            this.gmap.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($btn_geolocate_user.get(0));
            $btn_geolocate_user.on('click', 'button', (ev) => {
                ev.preventDefault();
                this.trigger_up('geolocate_user_location', {});
            });
        },
        /**
         * Compute marker color
         * @param {any} record
         * @return string
         */
        _getIconColor: function (record) {
            if (this.markerColor) {
                return this.markerColor;
            }

            if (!this.markerColors) {
                return this.defaultMarkerColor;
            }

            let color = null;
            let expression = null;
            let result = this.defaultMarkerColor;

            for (let i = 0; i < this.markerColors.length; i++) {
                color = this.markerColors[i][0];
                expression = this.markerColors[i][1];
                if (py.PY_isTrue(py.evaluate(expression, record.evalContext))) {
                    result = color;
                    break;
                }
            }
            return result;
        },
        /**
         * Compute marker icon
         * @param {any} record
         * @return string
         */
        _getIcon: function (record) {
            if (this.markerIcon) {
                return this.markerIcon;
            }

            if (!this.markerIcons) {
                return 'location-dot';
            }

            let icon = null;
            let expression = null;
            let result = null;

            for (let i = 0; i < this.markerIcons.length; i++) {
                icon = this.markerIcons[i][0];
                expression = this.markerIcons[i][1];
                if (py.PY_isTrue(py.evaluate(expression, record.evalContext))) {
                    result = icon;
                    break;
                }
            }
            return result;
        },
        /**
         * Create marker
         * @param {any} latLng: instance of google LatLng
         * @param {any} record
         * @param {string} color
         * @param {string} markerIcon: fontAwesome icon name
         * @returns {object} Google marker instance
         */
        _createMarker: function (latLng, record, color, markerIcon) {
            markerIcon = markerIcon || '';
            const strokeColor = '#2b2b2b';
            const iconFa = FontAwesomeSVG.getIcon(markerIcon);
            const scale = this.markerIconScale || 1.0;
            const options = {
                position: latLng,
                map: this.gmap,
                optimized: true,
                _odooRecord: record,
                _odooMarkerColor: color,
                icon: {
                    path: iconFa[4],
                    fillColor: color,
                    fillOpacity: 0.95,
                    strokeWeight: 1,
                    strokeColor: strokeColor,
                    scale: 0.07 * scale,
                    anchor: new google.maps.Point(iconFa[0] / 2, iconFa[1]),
                },
            };
            const title = this.fieldTitle ? record.data[this.fieldTitle] : record.data.name || record.data.display_name;
            if (title) {
                options['title'] = title;
            }
            if (color) {
                options.icon.fillColor = color;
                options._odooMarkerColor = color;
            }
            const marker = new google.maps.Marker(options);
            return marker;
        },
        /**
         * Get markers list
         * @returns Array
         */
        getMarkers: function () {
            return this.markers || [];
        },
        /**
         * Reset markers list
         */
        clearMarkers: function () {
            if (this.markerCluster) {
                this.markerCluster.clearMarkers();
            } else {
                this.markers.map((m) => m.setMap(null));
            }
            this.markers.splice(0);
        },
        /**
         * Handle Multiple Markers present at the same coordinates
         */
        _onHandleMarker: function (marker) {
            const markers = this.getMarkers();
            const existingRecords = [];
            if (markers.length > 0) {
                const position = marker.getPosition();
                markers.forEach((_cMarker) => {
                    if (position && position.equals(_cMarker.getPosition())) {
                        marker.setMap(null);
                        existingRecords.push(_cMarker._odooRecord);
                    }
                });
            }
            this.markers.push(marker);
            google.maps.event.addListener(marker, 'click', this._markerInfoWindow.bind(this, marker, existingRecords));
        },
        /**
         * Marker info window
         * @param {any} marker: instance of google marker
         * @param {any} record
         * @return function
         */
        _markerInfoWindow: function (marker, currentRecords) {
            let _content = '';
            let _buttonActions = '';

            const markerDiv = document.createElement('div');
            markerDiv.className = 'o_kanban_view';

            const markerContent = document.createElement('div');
            markerContent.className = 'o_kanban_group';

            if (currentRecords.length > 0) {
                currentRecords.forEach((_record) => {
                    _content = this._generateMarkerInfoWindow(_record);
                    _buttonActions = this._markerInfoWindowActionButton(_record);

                    _content.appendTo(_buttonActions);
                    _buttonActions.appendTo(markerContent);
                });
            }
            const markerIwContent = this._generateMarkerInfoWindow(marker._odooRecord);
            const buttonNavigate = this._markerInfoWindowActionButton(marker._odooRecord);

            markerIwContent.appendTo(buttonNavigate);
            buttonNavigate.appendTo(markerContent);
            markerDiv.appendChild(markerContent);

            this.infoWindow.setContent(markerDiv);
            this.infoWindow.open(this.gmap, marker);
        },
        /**
         * Marker button navigate to
         * @private
         * @returns jQuery Element
         */
        _markerInfoWindowActionButton: function (record) {
            const lat = record.data[this.fieldLat];
            const lng = record.data[this.fieldLng];

            const $buttons = $(
                qweb.render('GoogleMapView.InfoMarkerButtonAction', { widget: this, destination: `${lat},${lng}` })
            );

            $buttons.on('click', '#btn-open_form', (ev) => {
                ev.preventDefault();
                this.trigger_up('open_record', {
                    id: record.id,
                });
            });

            return $buttons;
        },
        /**
         * @private
         */
        _generateMarkerInfoWindow: function (record) {
            const markerIw = new GoogleMapRecord(this, record, this.recordOptions);
            return markerIw;
        },
        /**
         * Render markers
         * @private
         * @param {Object} record
         */
        _renderMarkers: function () {
            let color, latLng, lat, lng, marker, markerIcon;
            this.state.data.forEach((record) => {
                color = this._getIconColor(record);
                markerIcon = this._getIcon(record);
                lat = typeof record.data[this.fieldLat] === 'number' ? record.data[this.fieldLat] : 0.0;
                lng = typeof record.data[this.fieldLng] === 'number' ? record.data[this.fieldLng] : 0.0;
                if (lat !== 0.0 || lng !== 0.0) {
                    latLng = new google.maps.LatLng(lat, lng);
                    marker = this._createMarker(latLng, record, color, markerIcon);
                    this._onHandleMarker(marker);
                }
            });
        },
        /**
         * Default location
         */
        _getDefaultCoordinate: function () {
            return new google.maps.LatLng(0.0, 0.0);
        },
        /**
         * @override
         */
        async _renderView() {
            await this._super.apply(this, arguments);
            this.handleGoogleMapLoader();
        },
        /**
         * @override
         */
        initializeGoogle: function () {
            if (this.state.context.edit_geo_field) {
                this.renderEditGoogleMap();
            } else {
                this.renderGoogleMap();
            }
        },
        /**
         * Render google maps
         */
        renderGoogleMap: function () {
            // reset markers
            this.clearMarkers();
            // create instance of google maps
            this._initMap();
            // create markers
            this._renderMarkers();
            // handle marker clusterer
            this._initMarkerCluster();
            // center the map
            this._map_center_geometry();
            // load sidebar
            this._renderSidebar();
        },
        /**
         * Render google maps in edit mode by allow user to drag marker
         * Expected to render only one marker
         */
        renderEditGoogleMap: function () {
            // reset markers
            this.clearMarkers();
            // create instance of google maps
            this._initMap();
            // create markers
            this._renderMarkers();
            // set marker editable
            this.setMarkerDraggable();
            // center the map
            this._map_edit_center_geometry();
        },
        _initMarkerCluster: function () {
            if (!this.disableClusterMarker) {
                const markers = this.getMarkers();
                if (!this.markerCluster) {
                    this.markerCluster = new markerClusterer.MarkerClusterer({ map: this.gmap, markers });
                    this.markerCluster.addListener('click', () => this.infoWindow.close());
                } else {
                    this.markerCluster.addMarkers(markers);
                }
            }
        },
        _map_edit_center_geometry: function() {
            const markers = this.getMarkers();
            if (markers.length) {
                const markerPosition = markers[0].getPosition();
                this.gmap.setCenter(markerPosition);
                google.maps.event.addListenerOnce(this.gmap, 'idle', () => {
                    google.maps.event.trigger(this.gmap, 'resize');
                    if ( markerPosition.lat() === 0.0 && markerPosition.lng() === 0.0) {
                        this.gmap.setZoom(2);
                    } else {
                        this.gmap.setZoom(17);
                    }
                });
            }
        },
        /**
         * Center map
         */
        _map_center_geometry: function () {
            const mapBounds = new google.maps.LatLngBounds();
            this.markers.forEach((marker) => {
                mapBounds.extend(marker.getPosition());
            });
            this.gmap.fitBounds(mapBounds);
            google.maps.event.addListenerOnce(this.gmap, 'idle', () => {
                google.maps.event.trigger(this.gmap, 'resize');
                if (this.gmap.getZoom() > 17) this.gmap.setZoom(17);
            });
        },
        setMarkerDraggable: function () {
            let editableMarker;
            const markers = this.getMarkers();
            if (markers.length <= 0) {
                let latLng = this._getDefaultCoordinate();
                let record = this.state.data[0];
                let color = this._getIconColor(record);
                editableMarker = this._createMarker(latLng, record, color);
                this.markers.push(editableMarker);
            } else {
                editableMarker = markers[0];
            }
            editableMarker.setOptions({
                optimized: false,
                draggable: true,
                animation: google.maps.Animation.BOUNCE,
            });
            this.$right_sidebar.toggleClass('open');
            google.maps.event.addListenerOnce(this.gmap, 'idle', () => {
                google.maps.event.trigger(this.gmap, 'resize');
                this.gmap.setCenter(editableMarker.getPosition());
            });
            google.maps.event.addListenerOnce(editableMarker, 'dragend', () => {
                this.gmap.setCenter(editableMarker.getPosition());
            });
            this.editableMarkerDragEnd = google.maps.event.addListener(editableMarker, 'dragend', () => {
                this.gmap.panTo(editableMarker.getPosition());
            });
        },
        disableMarkerDraggable: function () {
            const markers = this.getMarkers();
            if (markers.length) {
                markers[0].setOptions({ draggable: false, animation: null });
                if (this.editableMarkerDragEnd) {
                    google.maps.event.removeListener(this.editableMarkerDragEnd);
                }
            }
        },
        /**
         * Render list of `display_name` of records loaded in the map
         */
        _renderSidebar: function () {
            const sidebarRender = new GoogleMapSidebar(this, this.state.data, this.sidebarTitle, this.sidebarSubtitle);
            const $rightSidebar = this.$right_sidebar.find('.content');
            $rightSidebar.empty();
            sidebarRender.appendTo($rightSidebar);
        },
        destroy: function () {
            if (this.editableMarkerDragEnd) {
                google.maps.event.removeListener(this.editableMarkerDragEnd);
            }
            google.maps.event.clearInstanceListeners(this.gmap);
            this._super.apply(this, arguments);
        },
    });

    return {
        GoogleMapRenderer: GoogleMapRenderer,
        GoogleMapRecord: GoogleMapRecord,
    };
});
