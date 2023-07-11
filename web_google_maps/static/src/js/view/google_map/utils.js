odoo.define('web_google_maps.GoogleMapLoaderUtil', function (require) {
    'use strict';

    const GoogleMapLoaderUtil = {
        /**
         * A function where you can start your Google stuff
         */
        initializeGoogle: function () {
            // Not implemented; designed to be overrided
        },
        /**
         * A function to handle in case the Google loader is failed
         * @param {string} err
         */
        handleGoogleLoaderFailure: function (err) {
            console.warn(err);
        },
        /**
         * Async function to fetch Google maps settings
         * Later the settings will be used by Google Maps loader
         */
        handleGoogleMapLoader: async function () {
            const settings = this.loaderOptions || {};
            if (Object.keys(settings).length <= 0) {
                const settings = await this._rpc({ route: '/web/google_maps_settings' });
                if (settings) {
                    this.loaderOptions = {
                        apiKey: settings.api_key,
                        version: settings.version,
                        libraries: settings.libraries,
                        theme: settings.theme,
                    };
                    if (settings.region) {
                        this.loaderOptions.region = settings.region;
                    }
                    if (settings.language) {
                        this.loaderOptions.language = settings.language;
                    }
                    this._handleGoogleMapLoader();
                }
            } else {
                this._handleGoogleMapLoader();
            }
        },
        /**
         * Private function to handle Google Maps Loader
         */
        _handleGoogleMapLoader: function () {
            const settings = this.loaderOptions || {};
            if (Object.keys(settings).length) {
                this.googleLoader = new google.maps.plugins.loader.Loader(settings);
                this.googleLoader.loadCallback((e) => {
                    if (e) {
                        this.handleGoogleLoaderFailure(e);
                    } else {
                        this.initializeGoogle();
                    }
                });
            } else if (this.googleLoader) {
                this.initializeGoogle();
            } else {
                this.handleGoogleLoaderFailure('Google loader is failed');
            }
        },
    };

    return GoogleMapLoaderUtil;
});
