// Rozenite's Network Activity plugin intercepts `expo/fetch` by patching the module export that
// Expo's lazy `global.fetch` getter resolves to. That only reaches the app if it happens before
// anything materializes `global.fetch` and captures a direct reference to it — which
// `abortcontroller-polyfill/dist/polyfill-patch-fetch` in `./globalPolyfills` does.
// So this has to be imported before `./globalPolyfills`, otherwise the plugin panel stays empty.

if (__DEV__) {
    // eslint-disable-next-line import/no-extraneous-dependencies
    const { withOnBootNetworkActivityRecording } = require('@rozenite/network-activity-plugin');

    withOnBootNetworkActivityRecording();
}
