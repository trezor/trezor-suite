/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable require-await */
const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins');

const { getMainApplicationOrThrow } = AndroidConfig.Manifest;

async function setCustomConfigAsync(config, androidManifest) {
    const mainApplication = getMainApplicationOrThrow(androidManifest);
    const mainActivity = mainApplication.activity?.[0];

    if (!mainActivity) {
        throw new Error('Cannot find main activity.');
    }

    // check if the intent-filter with the USB_DEVICE_ATTACHED action already exists
    const existingIntentFilter = mainActivity['intent-filter']?.find(
        ({ action }) =>
            action?.find(
                ({ $: { 'android:name': name } }) =>
                    name === 'android.hardware.usb.action.USB_DEVICE_ATTACHED' ||
                    name === 'android.hardware.usb.action.USB_DEVICE_DETACHED',
            ) !== undefined,
    );

    if (!existingIntentFilter) {
        mainActivity['intent-filter']?.push({
            action: [
                {
                    $: {
                        'android:name': 'android.hardware.usb.action.USB_DEVICE_ATTACHED',
                    },
                },
                {
                    $: {
                        'android:name': 'android.hardware.usb.action.USB_DEVICE_DETACHED',
                    },
                },
            ],
        });
    }

    // check if the meta-data with the android.hardware.usb.action.USB_DEVICE_ATTACHED resource already exists
    const existingMetaData = mainActivity['meta-data']?.find(
        ({ $: { 'android:name': name } }) =>
            name === 'android.hardware.usb.action.USB_DEVICE_ATTACHED',
    );

    if (!existingMetaData) {
        if (!mainActivity['meta-data']) {
            mainActivity['meta-data'] = [];
        }

        mainActivity['meta-data']?.push({
            $: {
                'android:name': 'android.hardware.usb.action.USB_DEVICE_ATTACHED',
                'android:resource': '@xml/device_filter',
            },
        });
    }

    return androidManifest;
}

module.exports = config =>
    withAndroidManifest(config, async config => {
        // Modifiers can be async, but try to keep them fast.
        config.modResults = await setCustomConfigAsync(config, config.modResults);

        return config;
    });
