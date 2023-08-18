import produce from 'immer';

import {
    discoveryActions,
    selectDiscoveryByDeviceState,
    DiscoveryRootState,
} from '@suite-common/wallet-core';
import type { InvityServerEnvironment } from '@suite-common/invity';
import { getNumberFromPixelString, versionUtils } from '@trezor/utils';
import { isWeb, getWindowWidth } from '@trezor/env-utils';
import { variables } from '@trezor/components';
import { SuiteThemeVariant } from '@trezor/suite-desktop-api';
import { TRANSPORT, TransportInfo, ConnectSettings } from '@trezor/connect';
import { DiscoveryStatus } from '@suite-common/wallet-constants';

import { getIsTorEnabled, getIsTorLoading } from 'src/utils/suite/tor';
import { getStatus } from 'src/utils/suite/device';
import type { OAuthServerEnvironment } from 'src/types/suite/metadata';
import { ensureLocale } from 'src/utils/suite/l10n';
import type { Locale } from 'src/config/suite/languages';
import { SUITE, STORAGE } from 'src/actions/suite/constants';
import { Action, TrezorDevice, Lock, TorBootstrap, TorStatus } from 'src/types/suite';
import { getFirmwareVersion } from '@trezor/device-utils';
import { networks, Network } from '@suite-common/wallet-config';

export interface SuiteRootState {
    suite: SuiteState;
}

export interface DebugModeOptions {
    invityServerEnvironment?: InvityServerEnvironment;
    oauthServerEnvironment?: OAuthServerEnvironment;
    showDebugMenu: boolean;
    checkFirmwareAuthenticity: boolean;
    transports: Extract<NonNullable<ConnectSettings['transports']>[number], string>[];
}

export interface AutodetectSettings {
    language: boolean;
    theme: boolean;
}

export type SuiteLifecycle =
    | { status: 'initial' }
    | { status: 'loading' }
    | { status: 'ready' }
    // errors set from connect, should be renamed
    | { status: 'error'; error: string }
    // blocked if the instance cannot upgrade due to older version running,
    // blocking in case instance is running older version thus blocking other instance
    | { status: 'db-error'; error: 'blocking' | 'blocked' };

export interface Flags {
    initialRun: boolean; // true on very first launch of Suite, will switch to false after completing onboarding process
    // is not saved to storage at the moment, so for simplicity of types set to be optional now
    // recoveryCompleted: boolean;
    // pinCompleted: boolean;
    // passphraseCompleted: boolean;
    taprootBannerClosed: boolean; // banner in account view informing about advantages of using Taproot
    firmwareTypeBannerClosed: boolean; // banner in Crypto settings suggesting switching firmware type
    discreetModeCompleted: boolean; // dashboard UI, user tried discreet mode
    securityStepsHidden: boolean; // dashboard UI
    dashboardGraphHidden: boolean; // dashboard UI
    dashboardAssetsGridMode: boolean; // dashboard UI
}

export interface SuiteSettings {
    theme: {
        variant: Exclude<SuiteThemeVariant, 'system'>;
    };
    language: Locale;
    torOnionLinks: boolean;
    isCoinjoinReceiveWarningHidden: boolean;
    isDesktopSuitePromoHidden: boolean;
    debug: DebugModeOptions;
    autodetect: AutodetectSettings;
}

export interface SuiteState {
    online: boolean;
    torStatus: TorStatus;
    torBootstrap: TorBootstrap | null;
    lifecycle: SuiteLifecycle;
    transport?: Partial<TransportInfo>;
    device?: TrezorDevice;
    locks: Lock[];
    flags: Flags;
    settings: SuiteSettings;
}

const initialState: SuiteState = {
    online: true,
    torStatus: TorStatus.Disabled,
    torBootstrap: null,
    lifecycle: { status: 'initial' },
    locks: [],
    flags: {
        initialRun: true,
        // recoveryCompleted: false;
        // pinCompleted: false;
        // passphraseCompleted: false;
        discreetModeCompleted: false,
        taprootBannerClosed: false,
        firmwareTypeBannerClosed: false,
        securityStepsHidden: false,
        dashboardGraphHidden: false,
        dashboardAssetsGridMode:
            getWindowWidth() < getNumberFromPixelString(variables.SCREEN_SIZE.SM),
    },
    settings: {
        theme: {
            variant: 'light',
        },
        language: ensureLocale('en'),
        torOnionLinks: isWeb(),
        isCoinjoinReceiveWarningHidden: false,
        isDesktopSuitePromoHidden: false,
        debug: {
            invityServerEnvironment: undefined,
            showDebugMenu: false,
            checkFirmwareAuthenticity: false,
            transports: [],
        },
        autodetect: {
            language: true,
            theme: true,
        },
    },
};

const changeLock = (draft: SuiteState, lock: Lock, enabled: boolean) => {
    if (enabled) {
        draft.locks.push(lock);
    } else {
        const index = draft.locks.lastIndexOf(lock);
        draft.locks.splice(index, 1);
    }
};

const setFlag = (draft: SuiteState, key: keyof Flags, value: boolean) => {
    draft.flags[key] = value;
};

const suiteReducer = (state: SuiteState = initialState, action: Action): SuiteState =>
    produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOAD:
                draft.flags = {
                    ...draft.flags,
                    ...action.payload.suiteSettings?.flags,
                };
                draft.settings = {
                    ...draft.settings,
                    ...action.payload.suiteSettings?.settings,
                };
                break;
            case STORAGE.ERROR:
                draft.lifecycle = { status: 'db-error', error: action.payload };
                break;
            case SUITE.INIT:
                draft.lifecycle = { status: 'loading' };
                break;
            case SUITE.READY:
                draft.lifecycle = { status: 'ready' };
                break;

            case SUITE.ERROR:
                draft.lifecycle = { status: 'error', error: action.error };
                break;

            case SUITE.SELECT_DEVICE:
            case SUITE.UPDATE_SELECTED_DEVICE:
                draft.device = action.payload;
                break;

            case SUITE.SET_LANGUAGE:
                draft.settings.language = action.locale;
                break;

            case SUITE.SET_DEBUG_MODE:
                draft.settings.debug = { ...draft.settings.debug, ...action.payload };
                break;

            case SUITE.SET_FLAG:
                setFlag(draft, action.key, action.value);
                break;

            case SUITE.SET_THEME:
                draft.settings.theme.variant = action.variant;
                break;

            case SUITE.SET_AUTODETECT:
                draft.settings.autodetect = {
                    ...draft.settings.autodetect,
                    ...action.payload,
                };
                break;

            case TRANSPORT.START:
                draft.transport = action.payload;
                break;

            case TRANSPORT.ERROR:
                draft.transport = {
                    bridge: action.payload.bridge,
                    udev: action.payload.udev,
                };
                break;

            case SUITE.ONLINE_STATUS:
                draft.online = action.payload;
                break;

            case SUITE.TOR_STATUS:
                draft.torStatus = action.payload;
                break;

            case SUITE.TOR_BOOTSTRAP:
                draft.torBootstrap = action.payload;
                break;

            case SUITE.ONION_LINKS:
                draft.settings.torOnionLinks = action.payload;
                break;

            case SUITE.COINJOIN_RECEIVE_WARNING:
                draft.settings.isCoinjoinReceiveWarningHidden = action.payload;
                break;
            case SUITE.DESKTOP_SUITE_PROMO:
                draft.settings.isDesktopSuitePromoHidden = action.payload;
                break;

            case SUITE.LOCK_UI:
                changeLock(draft, SUITE.LOCK_TYPE.UI, action.payload);
                break;

            case SUITE.LOCK_DEVICE:
                changeLock(draft, SUITE.LOCK_TYPE.DEVICE, action.payload);
                break;

            case SUITE.LOCK_ROUTER:
                changeLock(draft, SUITE.LOCK_TYPE.ROUTER, action.payload);
                break;

            case discoveryActions.startDiscovery.type:
                changeLock(draft, SUITE.LOCK_TYPE.DEVICE, true);
                break;

            case discoveryActions.completeDiscovery.type:
            case discoveryActions.stopDiscovery.type:
                changeLock(draft, SUITE.LOCK_TYPE.DEVICE, false);
                break;

            case SUITE.REQUEST_DEVICE_RECONNECT:
                if (draft.device) {
                    draft.device.reconnectRequested = true;
                }
                break;

            // no default
        }
    });

export const selectTorState = (state: SuiteRootState) => {
    const { torStatus, torBootstrap } = state.suite;
    return {
        isTorEnabled: getIsTorEnabled(torStatus),
        isTorLoading: getIsTorLoading(torStatus),
        isTorError: torStatus === TorStatus.Error,
        isTorDisabling: torStatus === TorStatus.Disabling,
        isTorDisabled: torStatus === TorStatus.Disabled,
        isTorEnabling: torStatus === TorStatus.Enabling,
        torBootstrap,
    };
};

export const selectDebug = (state: SuiteRootState) => state.suite.settings.debug;

export const selectDevice = (state: SuiteRootState) => state.suite.device;
export const selectLanguage = (state: SuiteRootState) => state.suite.settings.language;
export const selectDeviceState = (state: SuiteRootState) => {
    const device = selectDevice(state);
    return device && getStatus(device);
};

export const selectLocks = (state: SuiteRootState) => state.suite.locks;

export const selectIsDeviceLocked = (state: SuiteRootState) =>
    state.suite.locks.includes(SUITE.LOCK_TYPE.DEVICE) ||
    state.suite.locks.includes(SUITE.LOCK_TYPE.UI);

export const selectIsActionAbortable = (state: SuiteRootState) =>
    state.suite.transport?.type === 'BridgeTransport'
        ? versionUtils.isNewerOrEqual(state.suite.transport?.version as string, '2.0.31')
        : true; // WebUSB

export const selectDiscoveryForDevice = (state: DiscoveryRootState & { suite: SuiteState }) =>
    selectDiscoveryByDeviceState(state, state.suite.device?.state);

/**
 * Helper selector called from components
 * return `true` if discovery process is running/completed and `authConfirm` is required
 */
export const selectIsDiscoveryAuthConfirmationRequired = (
    state: DiscoveryRootState & { suite: SuiteState },
) => {
    const discovery = selectDiscoveryForDevice(state);

    return (
        discovery &&
        discovery.authConfirm &&
        (discovery.status < DiscoveryStatus.STOPPING ||
            discovery.status === DiscoveryStatus.COMPLETED)
    );
};

export const selectSupportedNetworks = (state: SuiteRootState) => {
    const device = selectDevice(state);
    const deviceModelInternal = device?.features?.internal_model;
    const firmwareVersion = getFirmwareVersion(device);

    return Object.entries(networks)
        .map(([symbol, network]) => {
            const support =
                'support' in network ? (network.support as Network['support']) : undefined;

            const firmwareSupportRestriction =
                deviceModelInternal && support?.[deviceModelInternal];
            const isSupportedByApp =
                !firmwareSupportRestriction ||
                versionUtils.isNewerOrEqual(firmwareVersion, firmwareSupportRestriction);

            const unavailableReason = isSupportedByApp
                ? device?.unavailableCapabilities?.[symbol]
                : 'update-required';

            if (['no-support', 'no-capability'].includes(unavailableReason || '')) {
                return null;
            }

            return symbol;
        })
        .filter(Boolean) as Network['symbol'][]; // Filter out null values
};

export default suiteReducer;
