odoo.define('web_google_maps.MapRenderer', function (require) {
    'use strict';

    var core = require('web.core');
    var QWeb = require('web.QWeb');
    var session = require('web.session');
    var utils = require('web.utils');
    var AbstractRenderer = require('web.AbstractRenderer');

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
                qwebAddIf(node, _.str.sprintf("!kanban_compute_domain(%s)", JSON.stringify(modifiers.invisible)));
            }
        }
        switch (node.tag) {
            case 'button':
            case 'a':
                var type = node.attrs.type || '';
                if (_.indexOf('action,object,edit,open,delete,url,set_cover'.split(','), type) !== -1) {
                    _.each(node.attrs, function (v, k) {
                        if (_.indexOf('icon,type,name,args,string,context,states,kanban_states'.split(','), k) !== -1) {
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

    var MapRenderer = AbstractRenderer.extend({
        template: 'MapView',
        /**
         * @constructor
         * @param {Widget} parent
         * @param {Object} state
         * @param {Object} params
         */
        init: function (parent, state, params) {
            this._super.apply(this, arguments);
            this.displayFields = params.displayFields;
            this.model = params.model;

            this.qweb = new QWeb(session.debug, {_s: session.origin});
            console.log(' state ');
            console.log(state);
            console.log(' params ');
            console.log(params);
            // var templates = findInNode(this.arch, function (n) { return n.tag === 'templates';});
            // transformQwebTemplate(templates, state.fields);
            // this.qweb.add_template(utils.json_node_to_xml(templates));

            console.log(this);
        },
        start: function () {
            this._initMap();
            return this._super();
        },
        /**
         * Initialize map view
         */
        _initMap: function () {
            var default_loc = {lat: 34.268551, lng: 17.825751};
            this.map = new google.maps.Map(this.$('.o_map_view').get(0), {
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                zoom: 3,
                minZoom: 3,
                center: default_loc,
                maxZoom: 20,
                fullscreenControl: true,
                mapTypeControl: true,
                mapTypeControlOptions: {
                    style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                    position: google.maps.ControlPosition.TOP_CENTER
                }
            });
            this.marker_cluster = new MarkerClusterer(this.map, null, {
                imagePath: '/web_google_maps/static/src/img/m'
            });
        },
        _renderMarkers: function () {
            console.log('_renderMarkers');
        },
        _render: function () {
            console.log(' _render ');
            return this._super();
        }
    });

    return MapRenderer;

});
