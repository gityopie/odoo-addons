odoo.define('web_google_maps.GoogleMapSidebar', function (require) {
    'use strict';

    const Widget = require('web.Widget');

    const GoogleMapSidebar = Widget.extend({
        template: 'GoogleMapView.Sidebar',
        events: {
            'click .o_map_sidebar_record': 'onClickSidebarRecord',
            'click button#open-record': 'openRecord',
        },
        init: function (parent, records, title, subtitle) {
            this._super.apply(this, arguments);
            this.parent = parent;
            this.records = records;
            this.editable = parent.editable;
            this.fieldTitle = title;
            this.fieldSubtitle = subtitle;
            this.viewTitle = parent.viewTitle;
        },
        /**
         * Click handler for the sidebar record
         * @param {Object} event
         */
        onClickSidebarRecord: function (ev) {
            ev.preventDefault();
            const data_id = $(ev.currentTarget).data('res-id');
            if (data_id) {
                const markers = this.parent.getMarkers();
                const marker = _.find(markers, (m) => m._odooRecord.res_id === data_id);
                if (marker) {
                    this.parent.gmap.panTo(marker.getPosition());
                    google.maps.event.addListenerOnce(this.parent.gmap, 'idle', () => {
                        google.maps.event.trigger(this.parent.gmap, 'resize');
                        if (this.parent.gmap.getZoom() < 12) this.parent.gmap.setZoom(12);
                        google.maps.event.trigger(marker, 'click');
                    });
                }
            }
        },
        /**
         * Get marker color
         * @param {Object} record
         */
        getMarkerColor: function (record) {
            let color = '#989696';
            const markers = this.parent.getMarkers();
            const marker = _.find(markers, (m) => m._odooRecord.res_id === record.res_id);
            if (marker) {
                color = marker._odooMarkerColor;
            }
            return color;
        },
        _getDisplayName: function (record, fieldName, defaultLabel) {
            let default_display_name = defaultLabel || 'Unknown';
            if (fieldName) {
                if (record.fields.hasOwnProperty(fieldName)) {
                    if (record.fields[fieldName].type === 'many2one') {
                        default_display_name = record.data[fieldName].data ? record.data[fieldName].data.display_name : ' - ';
                    } else if (record.fields[fieldName].type === 'char') {
                        default_display_name = record.data[fieldName];
                    }
                    return default_display_name;
                }
                console.warn(
                    'Field "' +
                    fieldName +
                    '" not found in record. Field type supported are "many2one" and "char".'
                );
                return default_display_name;
            } else if (record.data.hasOwnProperty('display_name')) {
                default_display_name = record.data.display_name;
            } else if (record.data.hasOwnProperty('name')) {
                default_display_name = record.data.name;
            } else if (record.fields.hasOwnProperty('display_name')) {
                let display_name_field;
                if (record.fields.display_name.type === 'char') {
                    default_display_name = record.data.display_name;
                } else if (
                    record.fields['display_name'].hasOwnProperty('depends') &&
                    record.fields['display_name'].depends.length > 0
                ) {
                    display_name_field = record.fields[record.fields['display_name'].depends[0]];
                    if (display_name_field) {
                        try {
                            default_display_name = record.data[display_name_field].data.display_name;
                        } catch (error) {
                            console.warn(error);
                        }
                    }
                }
            }
            return default_display_name;
        },
        /**
         * Get display_name of record
         * @param {Object} record
         */
        getTitle: function (record) {
            let title = this._getDisplayName(record, this.fieldTitle, 'Unknown');
            return title;
        },
        /**
         * Get subtitle of record
         * @param {*} record
         */
        getSubtitle: function (record) {
            if (this.fieldSubtitle) {
                let title = this._getDisplayName(record, this.fieldSubtitle, '');
                return title;
            }
            return;
        },
        /**
         * Check if record has geolocated
         * @param {Object} record
         */
        hasGeolocation: function (record) {
            let result = false;
            try {
                const lat =
                    typeof record.data[this.parent.fieldLat] === 'number' ? record.data[this.parent.fieldLat] : 0.0;
                const lng =
                    typeof record.data[this.parent.fieldLng] === 'number' ? record.data[this.parent.fieldLng] : 0.0;
                if (lat !== 0.0 || lng !== 0.0) {
                    result = true;
                }
            } catch (error) {
                console.error(error);
            }
            return result;
        },
        /**
         * Open form view
         * @param {Object} event
         */
        openRecord: function (ev) {
            ev.preventDefault();
            const record_id = $(ev.currentTarget).parent().find('a').data('id');
            if (record_id) {
                this.trigger_up('open_record', { id: record_id });
            }
        },
    });

    return GoogleMapSidebar;
});
