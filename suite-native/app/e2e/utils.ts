import { expect as detoxExpect } from 'detox';
import { resolveConfig } from 'detox/internals';

import { LaunchArguments } from '@suite-native/config';
import { PreloadedState } from '@suite-native/state';
import { MNEMONICS, MODELS, Model, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { mergeDeepObject } from '@trezor/utils';

import { onDeviceOnboarding } from './pageObjects/deviceOnboardingActions';
import { onDevicePrompt } from './pageObjects/devicePromptActions';

const platform = device.getPlatform();

// There is inconsistency between platforms. Android needs to have 100% of an element visible to be able to interact with it.
// On the other hand, if we are trying to scroll to 100% visibility on iOS, it causes scrolling more than height of the screen and it makes Detox crash.
const SCROLL_VISIBILITY_THRESHOLD = platform === 'android' ? 100 : undefined;

const INITIAL_LAUNCH_ARGS: LaunchArguments = {
    // Do not synchronize communication with the trezor bridge and metro server running on localhost. Since the trezor
    // bridge is exchanging messages with the app all the time, the test runner would wait forever otherwise.
    detoxURLBlacklistRegex: '\\("^.*127.0.0.1.*",".*localhost.*","^*clients3\\.google\\.com*"\\)',

    // Main loop synchronization is infinitely blocking iOS tests while is the graph displayed, so we need to disable it.
    // Not sure about the cause of it yet.
    DTXDisableMainRunLoopSync: platform === 'ios',
    isDebugKeysAllowed: true,
    isTradingBuyEnabled: true,
    areDebugOnlyNetworksEnabled: true,
};

const TREZOR_E2E_DEVICE_LABEL = 'Trezor T - Tester';

export const wait = async (ms: number) => {
    await new Promise(resolve => setTimeout(resolve, ms));
};

export const appIsFullyLoaded = async () => {
    await waitFor(element(by.id('@screen/mainScrollView')))
        .toBeVisible()
        .withTimeout(35000);
};

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
    launchArgs: LaunchArguments;
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

const wipeAppData = async () => {
    await device.uninstallApp();
    await device.installApp();
};

export const openApp = async ({
    newInstance = true,
    wipeData = true,
    args = {},
}: {
    newInstance?: boolean;
    wipeData?: boolean;
    args?: LaunchArguments;
}) => {
    const launchArgs = {
        ...INITIAL_LAUNCH_ARGS,
        ...args,
    };

    if (wipeData) {
        await wipeAppData();
    }

    if (await isDebugTestBuild()) {
        await openExpoDevClientApp({ newInstance, launchArgs });
    } else {
        await device.launchApp({
            newInstance,
            launchArgs,
        });
    }

    if (launchArgs.preloadedState) {
        // wait for preloaded state to be applied
        await appIsFullyLoaded();
    }
};

export const scrollUntilVisible = async (
    target: Detox.IndexableNativeElement,
    scrollViewTestId: string = '@screen/mainScrollView',
) => {
    try {
        // Try to confirm that the element is visible without scrolling.
        await detoxExpect(target).toBeVisible(SCROLL_VISIBILITY_THRESHOLD);
    } catch {
        // If the element is not visible, then use the scroll to find it.
        const scrollViewElement = element(by.id(scrollViewTestId));
        await waitFor(scrollViewElement).toBeVisible().withTimeout(5000);

        await waitFor(target)
            .toBeVisible(SCROLL_VISIBILITY_THRESHOLD)
            .whileElement(by.id(scrollViewTestId))
            .scroll(300, 'down', 0.5, 0.5);

        // wait for scroll animation to finish before performing next action
        await wait(1000);
    }
};

export function getModelFromEnv(): Model {
    const envValue = process.env.EMULATOR_MODEL as Model;

    return MODELS.includes(envValue) ? envValue : 'T3T1';
}

export type PrepareTrezorEmulatorProps = {
    seed?: string;
    passphrase_protection?: boolean;
    model?: Model;
    version?: string;
};

const getFwVersion = (model: Model, version: string | undefined) => {
    if (model === 'T3W1') {
        return '2-main'; // At this time only this firmware works with T3W1
    } else {
        const modelSupportedFirmwares = TrezorUserEnvLink?.firmwares?.[model] || [];

        return (
            (version && modelSupportedFirmwares.find(v => v.replace('-arm', '') === version)) ||
            '2-latest'
        );
    }
};

export const prepareTrezorEmulator = async ({
    version,
    seed = MNEMONICS.mnemonic_immune,
    passphrase_protection = false,
    model = getModelFromEnv(),
    args,
}: PrepareTrezorEmulatorProps & { args?: LaunchArguments } = {}) => {
    if (platform === 'android') {
        // We need to restart the bridge and emulator to ensure a clean state
        await TrezorUserEnvLink.stopEmu();
        await TrezorUserEnvLink.stopBridge();
        await TrezorUserEnvLink.disconnect();
        await TrezorUserEnvLink.connect();

        const fwVersion = getFwVersion(model, version);
        // start with latest officially released firmware (necessary to pass the firmware checks)
        await TrezorUserEnvLink.startEmu({ model, version: fwVersion, wipe: true });

        if (seed) {
            await TrezorUserEnvLink.setupEmu({
                label: TREZOR_E2E_DEVICE_LABEL,
                mnemonic: seed,
                passphrase_protection,
            });
        }
        await TrezorUserEnvLink.startBridge('node-bridge');
    }
    // ATM we need to terminate app, start without new instance in order for the emulator to connect to the app
    await device.terminateApp();
    await openApp({ newInstance: false, wipeData: false, args });

    if (getModelFromEnv() === 'T3W1') {
        await onDevicePrompt.allowConnectToTrezor();
        await onDeviceOnboarding.enterTHPPairingCode();
    }
};

export const waitForElementByTextToBeVisible = (text: string, timeout = 30000) =>
    waitFor(element(by.text(text)))
        .toBeVisible()
        .withTimeout(timeout);

export const waitForElementByIdToBeVisible = (testId: string, timeout = 30000) =>
    waitFor(element(by.id(testId)))
        .toBeVisible()
        .withTimeout(timeout);

/**
 * Merges multiple preloaded state fragments into a single preloaded state and serializes the result.
 * Be mindful about the order of the fragments, as the later fragments will always override the earlier ones!
 */
export const preparePreloadedReduxState = (...stateFragments: PreloadedState[]): string => {
    const definedFragments = stateFragments.filter(fragment => fragment !== undefined);
    const mergedState = mergeDeepObject(...definedFragments);

    return JSON.stringify(mergedState);
};

export const inputTextToElement = async (element: Detox.IndexableNativeElement, text: string) => {
    // on Android it is very slow to type text symbol by symbol, for performance reasons `replaceText` is used instead.
    if (platform === 'android') {
        await element.replaceText(text);
    } else {
        // on iOS the replaceText do not trigger input events (focus, blur, etc.) so we need can not paste text there as for Android.
        // the typeText method is way faster than for Android, so there is not performance drawback.
        await element.tap();
        await element.typeText(text);
    }
};
