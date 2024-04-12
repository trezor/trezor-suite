/* eslint-disable @typescript-eslint/no-shadow */
const { withAndroidManifest } = require('expo/config-plugins');

function addAttributesToMainApplication(androidManifest, attributes) {
    const { manifest } = androidManifest;

    if (!Array.isArray(manifest['application'])) {
        console.warn('withAndroidMainApplicationAttributes: No application array in manifest?');

        return androidManifest;
    }

    const application = manifest['application'].find(
        item => item.$['android:name'] === '.MainApplication',
    );
    if (!application) {
        console.warn('withAndroidMainApplicationAttributes: No .MainApplication?');

        return androidManifest;
    }

    application.$ = { ...application.$, ...attributes };

    return androidManifest;
}

module.exports = function withAndroidMainApplicationAttributes(config, attributes) {
    return withAndroidManifest(config, config => {
        config.modResults = addAttributesToMainApplication(config.modResults, attributes);

        return config;
    });
};
