odoo.define('web_google_maps.GoogleMapSidebar', function (require) {
    'use strict';

    const Widget = require('web.Widget');

    const GoogleMapSidebar = Widget.extend({
        template: 'GoogleMapView.Sidebar',
        events: {
            'click .o_map_sidebar_record': 'onClickSidebarRecord',
            'click button#open-record': 'openRecord',
        },
        init: function (parent, records) {
            this._super.apply(this, arguments);
            this.parent = parent;
            this.records = records;
            this.editable = parent.editable;
        },
        /**
         * Click handler for the sidebar record
         * @param {Object} event
         */
        onClickSidebarRecord: function (ev) {
            ev.preventDefault();
            const data_id = $(ev.currentTarget).data('res-id');
            if (data_id) {
                const marker = _.find(this.parent.markers, (m) => m._odooRecord.res_id === data_id);
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
        getMarkerColor: function(record) {
            let color = '#989696';
            const marker = _.find(this.parent.markers, (m) => m._odooRecord.res_id === record.res_id);
            if (marker) {
                color = marker._odooMarkerColor
            }
            return color;
        },
        /**
         * Get display_name of record
         * @param {Object} record
         */
        getDisplayName: function (record) {
            let default_display_name = 'Unknown display_name';
            if (Object.prototype.hasOwnProperty.call(record.data, 'display_name')) {
                default_display_name = record.data.display_name;
            } else if (Object.prototype.hasOwnProperty.call(record.data, 'name')) {
                default_display_name = record.data.name;
            } else if (Object.prototype.hasOwnProperty.call(record.fields, 'display_name')) {
                const display_name_field =
                    record.fields['display_name'].depends.length > 0 ? record.fields['display_name'].depends[0] : false;
                if (display_name_field) {
                    try {
                        default_display_name = record.data[display_name_field].data.display_name;
                    } catch (error) {
                        console.warn(error);
                    }
                }
            }
            return default_display_name;
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
