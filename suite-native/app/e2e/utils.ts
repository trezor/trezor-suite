import { resolveConfig } from 'detox/internals';

const APP_LAUNCH_ARGS = {
    // Do not synchronize communication with the trezor bridge and metro server running on localhost. Since the trezor
    // bridge is exchanging messages with the app all the time, the test runner would wait forever otherwise.
    detoxURLBlacklistRegex: '\\("^.*127.0.0.1.*",".*localhost.*"\\)',
};

const platform = device.getPlatform();

export const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const getExpoDeepLinkUrl = () => {
    const expoLauncherUrl = encodeURIComponent(
        `http://localhost:8081/index.bundle?platform=${platform}&dev=true&minify=false&disableOnboarding=1`,
    );

    return `exp+trezor-suite-debug://expo-development-client/?url=${expoLauncherUrl}`;
};

const openExpoDevClientApp = async () => {
    const deepLinkUrl = getExpoDeepLinkUrl();

    if (platform === 'ios') {
        await device.launchApp({
            newInstance: true,
            launchArgs: APP_LAUNCH_ARGS,
        });

        await device.openURL({
            url: deepLinkUrl,
        });
    } else {
        await device.launchApp({
            newInstance: true,
            url: deepLinkUrl,
            launchArgs: APP_LAUNCH_ARGS,
        });
    }
};

// Inspired by Expo E2E detox-tests guide:
// See more: https://docs.expo.dev/build-reference/e2e-tests/#e2eutilsopenappjs-new-file
export const openApp = async () => {
    const { configurationName } = await resolveConfig();

    const isDebugTestBuild = configurationName.split('.')[2] === 'debug';

    if (isDebugTestBuild) {
        await openExpoDevClientApp();
    } else {
        await device.launchApp({
            newInstance: true,
            launchArgs: APP_LAUNCH_ARGS,
        });
    }
};
