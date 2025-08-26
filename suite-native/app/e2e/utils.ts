import { expect as detoxExpect } from 'detox';
import { resolveConfig } from 'detox/internals';

import { LaunchArguments } from '@suite-native/config';
import { PreloadedState } from '@suite-native/state';
import { MNEMONICS, MODELS, Model, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

const platform = device.getPlatform();

type LaunchArgumentsWithPreloadedState = Omit<LaunchArguments, 'preloadedState'> & {
    preloadedState?: PreloadedState;
};

const INITIAL_LAUNCH_ARGS: LaunchArgumentsWithPreloadedState = {
    // Do not synchronize communication with the trezor bridge and metro server running on localhost. Since the trezor
    // bridge is exchanging messages with the app all the time, the test runner would wait forever otherwise.
    detoxURLBlacklistRegex: '\\("^.*127.0.0.1.*",".*localhost.*","^*clients3\\.google\\.com*"\\)',

    // Main loop synchronization is infinitely blocking iOS tests while is the graph displayed, so we need to disable it.
    // Not sure about the cause of it yet.
    DTXDisableMainRunLoopSync: platform === 'ios',
    isConnectPopupEnabled: true,
    isDebugKeysAllowed: true,
    isTradingBuyEnabled: true,
};

export const TREZOR_E2E_DEVICE_LABEL = 'Trezor T - Tester';

export const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const getExpoDeepLinkUrl = () => {
    const expoLauncherUrl = encodeURIComponent(
        `http://localhost:8081?platform=${platform}&dev=true&minify=false&disableOnboarding=1`,
    );

    return `exp+trezor-suite-debug://expo-development-client/?url=${expoLauncherUrl}`;
};

const openExpoDevClientApp = async ({
    newInstance,
    launchArgs,
}: {
    newInstance: boolean;
    launchArgs: LaunchArgumentsWithPreloadedState;
}) => {
    const deepLinkUrl = getExpoDeepLinkUrl();

    if (platform === 'ios') {
        await device.launchApp({
            newInstance,
            launchArgs,
        });

        await device.openURL({
            url: deepLinkUrl,
        });
    } else {
        await device.launchApp({
            newInstance,
            url: deepLinkUrl,
            launchArgs,
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
export const openApp = async ({
    newInstance,
    args = {},
}: {
    newInstance: boolean;
    args?: LaunchArgumentsWithPreloadedState;
}) => {
    const launchArgs = {
        ...INITIAL_LAUNCH_ARGS,
        ...args,
    };

    if (await isDebugTestBuild()) {
        await openExpoDevClientApp({ newInstance, launchArgs });
    } else {
        await device.launchApp({
            newInstance,
            launchArgs,
        });
    }
};

type RestartAppProps = {
    args?: LaunchArgumentsWithPreloadedState;
};

export const restartApp = async ({ args = {} }: RestartAppProps = {}) => {
    await device.terminateApp();
    await openApp({
        newInstance: false,
        args,
    });
};

export const scrollUntilVisible = async (
    target: Detox.IndexableNativeElement,
    scrollViewTestId: string = '@screen/mainScrollView',
) => {
    try {
        // Try to confirm that the element is visible without scrolling.
        await detoxExpect(target).toBeVisible(100);
    } catch {
        // If the element is not visible, then use the scroll to find it.
        await waitFor(target)
            .toBeVisible(100)
            .whileElement(by.id(scrollViewTestId))
            .scroll(300, 'down');

        // add extra scroll in case that the element is still not fully visible.
        await element(by.id(scrollViewTestId)).scroll(150, 'down');
    }
};

export const appIsFullyLoaded = async () => {
    await waitFor(element(by.id('@screen/mainScrollView')))
        .toBeVisible()
        .withTimeout(35000);
};

function getModelFromEnv(): Model {
    const envValue = process.env.EMULATOR_MODEL as Model;

    return MODELS.includes(envValue) ? envValue : 'T3T1';
}

export type PrepareTrezorEmulatorProps = {
    seed?: string;
    passphrase_protection?: boolean;
    model?: Model;
    version?: string;
};

export const prepareTrezorEmulator = async ({
    version,
    seed = MNEMONICS.mnemonic_immune,
    passphrase_protection = false,
    model = getModelFromEnv(),
}: PrepareTrezorEmulatorProps = {}) => {
    if (platform === 'android') {
        // Prepare Trezor device for test scenario
        const modelSupportedFirmwares = TrezorUserEnvLink?.firmwares?.[model] || [];

        const fwVersion =
            (version && modelSupportedFirmwares.find(v => v.replace('-arm', '') === version)) ||
            '2-latest';
        await TrezorUserEnvLink.disconnect();
        await TrezorUserEnvLink.connect();
        // start with latest officially released firmware (necessary to pass the firmware checks)
        await TrezorUserEnvLink.startEmu({ model, version: fwVersion, wipe: true });

        if (seed) {
            await TrezorUserEnvLink.setupEmu({
                label: TREZOR_E2E_DEVICE_LABEL,
                mnemonic: seed,
                passphrase_protection,
            });
        }
        await TrezorUserEnvLink.startBridge();
    }
};

export const disconnectTrezorUserEnv = async () => {
    // Clear the connection to the Trezor emulator so the test does not synchronize with it when not necessary.
    await TrezorUserEnvLink.stopEmu();
    await TrezorUserEnvLink.stopBridge();
    await TrezorUserEnvLink.disconnect();
};

export const wait = async (ms: number) => {
    await new Promise(resolve => setTimeout(resolve, ms));
};

export const waitForElementByTextToBeVisible = (text: string, timeout = 30000) =>
    waitFor(element(by.text(text)))
        .toBeVisible()
        .withTimeout(timeout);

export const waitForElementByIdToBeVisible = (testId: string, timeout = 30000) =>
    waitFor(element(by.id(testId)))
        .toBeVisible()
        .withTimeout(timeout);
