import { resolveConfig } from 'detox/internals';
import { expect as detoxExpect } from 'detox';

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

const openExpoDevClientApp = async ({ newInstance }: { newInstance: boolean }) => {
    const deepLinkUrl = getExpoDeepLinkUrl();

    if (platform === 'ios') {
        await device.launchApp({
            newInstance,
            launchArgs: APP_LAUNCH_ARGS,
        });

        await device.openURL({
            url: deepLinkUrl,
        });
    } else {
        await device.launchApp({
            newInstance,
            url: deepLinkUrl,
            launchArgs: APP_LAUNCH_ARGS,
        });
    }
};

const isDebugTestBuild = async () => {
    const { configurationName } = await resolveConfig();

    const isDebugBuild = configurationName.split('.')[2] === 'debug';

    return isDebugBuild;
};

// Inspired by Expo E2E detox-tests guide:
// See more: https://docs.expo.dev/build-reference/e2e-tests/#e2eutilsopenappjs-new-file
export const openApp = async ({ newInstance }: { newInstance: boolean }) => {
    if (await isDebugTestBuild()) {
        await openExpoDevClientApp({ newInstance });
    } else {
        await device.launchApp({
            newInstance,
            launchArgs: APP_LAUNCH_ARGS,
        });
    }
};

export const restartApp = async () => {
    if (await isDebugTestBuild()) {
        await device.reloadReactNative();
    } else {
        await device.terminateApp();
        await openApp({ newInstance: false });
    }
};

export const scrollUntilVisible = async (matcher: Detox.NativeMatcher) => {
    try {
        // Try to confirm that the element is visible without scrolling.
        await detoxExpect(element(matcher)).toBeVisible();
    } catch (error) {
        // If the element is not visible, then use the scroll to find it.
        await waitFor(element(matcher))
            .toBeVisible()
            .whileElement(by.id('@screen/mainScrollView'))
            .scroll(250, 'down');
    }
};

export const appIsFullyLoaded = async () => {
    await waitFor(element(by.id('@screen/mainScrollView')))
        .toBeVisible()
        .withTimeout(20000);
};
