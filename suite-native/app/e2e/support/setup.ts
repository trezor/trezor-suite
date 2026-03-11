import { expect as jestExpect } from '@jest/globals';
import { resolveConfig } from 'detox/internals';

import { LaunchArguments } from '@suite-native/config';
import { PreloadedState } from '@suite-native/state';
import { mockInitialAppState } from '@suite-native/state/mocks';
import { MNEMONICS, Model, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { mergeDeepObject } from '@trezor/utils';

import { appIsFullyLoaded, getModelFromEnv, platform } from './utils';
import { onDeviceOnboarding } from '../pageObjects/deviceOnboardingActions';
import { onDevicePrompt } from '../pageObjects/devicePromptActions';

type PrepareTrezorEmulatorProps = {
    seed?: string;
    passphrase_protection?: boolean;
    model?: Model;
    version?: string;
};

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
    isTradingResidenceCheckEnabled: false,
};

const MODEL_NAMES: Record<Model, string> = {
    [Model.T1B1]: 'Model One',
    [Model.T2T1]: 'Model T',
    [Model.T3B1]: 'Safe 3',
    [Model.T3T1]: 'Safe 5',
    [Model.T3W1]: 'Safe 7',
};

const getTrezorE2eDeviceLabel = (model: Model) => `${MODEL_NAMES[model]} - Tester`;

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

const getFwVersion = (model: Model, version: string | undefined) => {
    const modelSupportedFirmwares = TrezorUserEnvLink?.firmwares?.[model] || [];
    const defaultLatestVersion = model === Model.T1B1 ? '1-latest' : '2-latest';

    return (
        (version && modelSupportedFirmwares.find(v => v.replace('-arm', '') === version)) ||
        defaultLatestVersion
    );
};

export const prepareTrezorEmulator = async ({
    version = process.env.TDR_FIRMWARE_VERSION,
    seed = MNEMONICS.mnemonic_immune,
    passphrase_protection = false,
    model = getModelFromEnv(),
    args,
}: PrepareTrezorEmulatorProps & { args?: LaunchArguments } = {}) => {
    if (platform === 'android') {
        const { currentTestName, testPath } = jestExpect.getState();
        await TrezorUserEnvLink.logTestDetails(
            ` - - - STARTING TEST ${currentTestName} (${testPath})`,
        );
        await TrezorUserEnvLink.connect();
        const fwVersion = getFwVersion(model, version);
        // start with latest officially released firmware (necessary to pass the firmware checks)
        await TrezorUserEnvLink.startEmu({ model, version: fwVersion, wipe: true });

        if (seed) {
            await TrezorUserEnvLink.setupEmu({
                label: getTrezorE2eDeviceLabel(model),
                mnemonic: seed,
                passphrase_protection,
            });
        }
        await TrezorUserEnvLink.startBridge('node-bridge');
    }
    // ATM we need to terminate app, start without new instance in order for the emulator to connect to the app
    await device.terminateApp();
    await openApp({ newInstance: false, wipeData: false, args });

    if (getModelFromEnv() === Model.T3W1) {
        await onDevicePrompt.allowConnectToTrezor();
        await onDeviceOnboarding.enterTHPPairingCode();
    }
};

/**
 * Merges multiple preloaded state fragments into the initial app state, to yield a complete preloaded state and serializes the result.
 * Be mindful about the order of the fragments, as the later fragments will always override the earlier ones!
 */
export const preparePreloadedReduxState = (...stateFragments: PreloadedState[]): string => {
    const initialStateAndFragments = [mockInitialAppState(), ...stateFragments];
    const definedFragments = initialStateAndFragments.filter(fragment => fragment !== undefined);
    const mergedState = mergeDeepObject(...definedFragments);

    return JSON.stringify(mergedState);
};
