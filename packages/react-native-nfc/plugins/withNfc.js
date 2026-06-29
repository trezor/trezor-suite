/* eslint-disable require-await */
const {
    AndroidConfig,
    withAndroidManifest,
    withEntitlementsPlist,
    withInfoPlist,
} = require('expo/config-plugins');

const { getMainApplicationOrThrow } = AndroidConfig.Manifest;

async function setNfcConfigAsync(_config, androidManifest) {
    const mainApplication = getMainApplicationOrThrow(androidManifest);
    const mainActivity = mainApplication.activity?.[0];

    if (!mainActivity) {
        throw new Error('Cannot find main activity.');
    }

    if (!mainActivity['intent-filter']) {
        mainActivity['intent-filter'] = [];
    }

    // Add TAG_DISCOVERED intent filter — catch-all for any NFC tag.
    // This ensures the activity receives NFC intents even when AAR opens the app.
    const existingTagFilter = mainActivity['intent-filter'].find(
        ({ action }) =>
            action?.find(
                ({ $: { 'android:name': name } }) => name === 'android.nfc.action.TAG_DISCOVERED',
            ) !== undefined,
    );

    if (!existingTagFilter) {
        mainActivity['intent-filter'].push({
            action: [
                {
                    $: {
                        'android:name': 'android.nfc.action.TAG_DISCOVERED',
                    },
                },
            ],
            category: [
                {
                    $: {
                        'android:name': 'android.intent.category.DEFAULT',
                    },
                },
            ],
        });
    }

    return androidManifest;
}

const withNfcAndroid = config =>
    withAndroidManifest(config, async config2 => {
        config2.modResults = await setNfcConfigAsync(config2, config2.modResults);

        return config2;
    });

const withNfcIosEntitlements = config =>
    withEntitlementsPlist(config, mod => {
        mod.modResults['com.apple.developer.nfc.readersession.formats'] = ['NDEF'];

        return mod;
    });

const withNfcIosInfoPlist = config =>
    withInfoPlist(config, mod => {
        mod.modResults.NFCReaderUsageDescription =
            '$(PRODUCT_NAME) needs NFC access to read Trezor backup cards.';

        return mod;
    });

module.exports = config => {
    config = withNfcAndroid(config);
    config = withNfcIosEntitlements(config);
    config = withNfcIosInfoPlist(config);

    return config;
};
