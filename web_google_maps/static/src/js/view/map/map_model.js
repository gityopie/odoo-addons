odoo.define('web_google_maps.MapModel', function(require) {
    'use strict';

    var BasicModel = require('web.BasicModel');

    var MapModel = BasicModel.extend({
        reload: function (id, options) {
            if (options && options.groupBy && !options.groupBy.length) {
                options.groupBy = this.defaultGroupedBy;
            }
            var def = this._super(id, options);
            return this._reloadProgressBarGroupFromRecord(id, def);
        },
        /**
         * @override
         */
        load: function (params) {
            this.defaultGroupedBy = params.groupBy;
            params.groupedBy = (params.groupedBy && params.groupedBy.length) ? params.groupedBy : this.defaultGroupedBy;
            return this._super(params);
        },
        /**
         * Ensures that there is no nested groups in Map (only the first grouping
         * level is taken into account).
         *
         * @override
         * @private
         * @param {Object} list valid resource object
         */
        _readGroup: function (list) {
            var self = this;
            if (list.groupedBy.length > 1) {
                list.groupedBy = [list.groupedBy[0]];
            }
            return this._super.apply(this, arguments);
        },
        _reloadProgressBarGroupFromRecord: function (recordID, def) {
            var element = this.localData[recordID];
            if (element.type !== 'record') {
                return def;
            }

            // If we updated a record, then we must potentially update columns'
            // progressbars, so we need to load groups info again
            var self = this;
            while (element) {
                if (element.progressBar) {
                    return def.then(function (data) {
                        return self._load(element, {onlyGroups: true}).then(function () {
                            return data;
                        });
                    });
                }
                element = this.localData[element.parentID];
            }
            return def;
        },
    });

    return MapModel;

});
