/* eslint-disable camelcase */
/**
 * Analytics (logging user behavior in the app)
 * @docs docs/misc/analytics.md
 */

import { ANALYTICS } from '@suite-actions/constants';
import { Dispatch, GetState, AppState } from '@suite-types';
import { getAnalyticsRandomId } from '@suite-utils/random';
import { encodeDataToQueryString } from '@suite-utils/analytics';
import { Account } from '@wallet-types';
import {
    isDesktop,
    setOnBeforeUnloadListener,
    getLocationHostname,
    getOsType,
    getEnvironment,
} from '@suite-utils/env';
import { setSentryUser } from '@suite-utils/sentry';
import { State } from '@suite-reducers/analyticsReducer';
import { DeviceMode } from 'trezor-connect';

export type AnalyticsAction =
    | { type: typeof ANALYTICS.ENABLE }
    | { type: typeof ANALYTICS.DISPOSE }
    | {
          type: typeof ANALYTICS.INIT;
          payload: {
              instanceId: string;
              sessionId: string;
              enabled: boolean;
              sessionStart: number;
          };
      };

// Don't forget to update docs with changelog!
// <breaking-change>.<analytics-extended>
export const version = '1.12';

export type AnalyticsEvent =
    | {
          /**
         suite-ready
         Triggers on application start. Logs part of suite setup that might have been loaded from storage
         but it might also be suite default setup that is loaded when suite starts for the first time.
         IMPORTANT: skipped if user opens suite for the first time. In such case, the first log will be 'initial-run-completed'
         */
          type: 'suite-ready';
          payload: {
              language: AppState['suite']['settings']['language'];
              enabledNetworks: AppState['wallet']['settings']['enabledNetworks'];
              localCurrency: AppState['wallet']['settings']['localCurrency'];
              discreetMode: AppState['wallet']['settings']['discreetMode'];
              screenWidth: number;
              screenHeight: number;
              // added in 1.1
              platform: string;
              platformLanguage: string;
              // added in 1.2
              tor: boolean;
              // added in 1.4
              rememberedStandardWallets: number;
              rememberedHiddenWallets: number;
              // added in 1.5
              theme: string;
              // added in 1.6
              suiteVersion: string;
              // added in 1.8
              browserName: string;
              browserVersion: string;
              osName: string;
              osVersion: string;
              windowWidth: number;
              windowHeight: number;
              // added in 1.9
              platformLanguages: string;
          };
      }
    | { type: 'transport-type'; payload: { type: string; version: string } }
    | {
          /**
         device-connect
         is logged when user connects device
         - if device is not in bootloader, some of its features are logged
         */
          type: 'device-connect';
          payload: {
              mode?: DeviceMode;
              firmware: string;
              pin_protection: boolean | null;
              passphrase_protection: boolean | null;
              totalInstances: number | null;
              backup_type: string;
              // added in 1.6
              isBitcoinOnly: boolean;
              // added in 1.7
              totalDevices: number;
              // added in 1.9
              language: string | null;
              model: string;
          };
      }
    | {
          /** if device is in bootloader, only this event is logged */
          type: 'device-connect';
          payload: { mode: 'bootloader' };
      }
    | {
          type: 'device-disconnect';
      }
    | {
          /**
         device-update-firmware
         is log after firmware update call to device is finished.
         */
          type: 'device-update-firmware';
          payload: {
              /** version of bootloader before update started. */
              fromBlVersion: string;
              /** version of firmware before update started. */
              fromFwVersion: string;
              /** version of the new firmware e.g 1.2.3, or omitted when installing custom fw */
              toFwVersion?: string;
              /** is new firmware bitcoin only variant?, or omitted when installing custom fw */
              toBtcOnly?: boolean;
              /** if finished with error, field error contains error string, otherwise is empty */
              error: string;
          };
      }
    | {
          /**
         initial-run-completed
         when new installation of trezor suite starts it is in initial-run mode which means that some additional screens appear (welcome, analytics, onboarding)
         it is completed either by going trough onboarding or skipping it. once completed event is registered, we log some data connected up to this point
          */
          type: 'initial-run-completed';
          payload: {
              analytics: false;
          };
      }
    | {
          type: 'initial-run-completed';
          payload: {
              analytics: true;
              /** how many users chose to create new wallet */
              createSeed: boolean;
              /** how many users chose to do recovery */
              recoverSeed: boolean;
          };
      }
    | {
          /**
         account-create
         logged either automatically upon each suite start as default switched on accounts are loaded
         or when user adds account manually
         */
          type: 'account-create';
          payload: {
              /** normal, segwit, legacy */
              type: Account['accountType'];
              /** index of account  */
              path: Account['path'];
              /** network (btc, eth, etc.) */
              symbol: Account['symbol'];
              /** if tokens added */
              tokensCount: number;
          };
      }
    | {
          type: 'accounts/empty-account/buy';
          payload: {
              symbol: string;
          };
      }
    | {
          type: 'accounts/empty-account/receive';
          payload: {
              symbol: string;
          };
      }
    | { type: 'dashboard/security-card/create-backup' }
    | { type: 'dashboard/security-card/seed-link' }
    | { type: 'dashboard/security-card/set-pin' }
    | { type: 'dashboard/security-card/change-pin' }
    | { type: 'dashboard/security-card/enable-passphrase' }
    | { type: 'dashboard/security-card/create-hidden-wallet' }
    | { type: 'dashboard/security-card/enable-discreet' }
    | {
          type: 'dashboard/security-card/toggle-discreet';
          payload: {
              value: boolean;
          };
      }
    | { type: 'menu/goto/switch-device' }
    | { type: 'menu/goto/suite-index' }
    | { type: 'menu/goto/wallet-index' }
    | { type: 'menu/goto/notifications-index' }
    | {
          type: 'menu/notifications/toggle';
          payload: {
              value: boolean;
          };
      }
    | { type: 'menu/goto/settings-index' }
    | {
          type: 'menu/settings/toggle';
          payload: {
              value: boolean;
          };
      }
    | {
          type: 'menu/settings/dropdown';
          payload: { option: 'all' | 'general' | 'device' | 'coins' | 'guide' };
      }
    | {
          type: 'menu/toggle-discreet';
          payload: {
              value: boolean;
          };
      }
    | {
          type: 'menu/goto/tor';
      }
    | {
          type: 'menu/toggle-tor';
          payload: {
              value: boolean;
          };
      }
    | {
          type: 'menu/toggle-onion-links';
          payload: {
              value: boolean;
          };
      }
    | {
          type: 'menu/guide';
      }
    | {
          type: 'guide/header/navigation';
          payload: {
              type: 'back' | 'close' | 'category';
              id?: string;
          };
      }
    | {
          type: 'guide/node/navigation';
          payload: {
              type: 'page' | 'category';
              id: string;
          };
      }
    | {
          type: 'guide/feedback/navigation';
          payload: {
              type: 'overview' | 'bug' | 'suggestion';
          };
      }
    | {
          type: 'guide/feedback/submit';
          payload: {
              type: 'bug' | 'suggestion';
          };
      }
    | {
          type: 'wallet/add-account';
          payload: {
              /** normal, segwit, legacy */
              type: Account['accountType'];
              /** index of account  */
              path: Account['path'];
              /** network (btc, eth, etc.) */
              symbol: Account['symbol'];
          };
      }
    | { type: 'switch-device/add-wallet' }
    // todo: check if forget remember works as expected
    | { type: 'switch-device/forget' }
    | { type: 'switch-device/remember' }
    | { type: 'switch-device/eject' }
    | { type: 'settings/device/goto/backup' }
    | { type: 'settings/device/goto/recovery' }
    | { type: 'settings/device/goto/firmware' }
    | {
          type: 'settings/device/change-pin-protection';
          payload: {
              remove: boolean | null;
          };
      }
    | {
          type: 'settings/device/change-pin';
      }
    | { type: 'settings/device/change-label' }
    | {
          type: 'settings/device/update-auto-lock';
          payload: {
              value: number;
          };
      }
    | {
          type: 'settings/device/goto/background';
          payload: {
              // added in 1.9
              custom: boolean;
          };
      }
    | {
          type: 'settings/device/background';
          payload: {
              // added in 1.9
              image?: string;
              format?: string;
              size?: number;
              resolutionWidth?: number;
              resolutionHeight?: number;
          };
      }
    | {
          type: 'settings/device/change-orientation';
          payload: {
              value: 0 | 90 | 180 | 270;
          };
      }
    | { type: 'settings/device/goto/wipe' }
    | {
          type: 'settings/device/change-passphrase-protection';
          payload: {
              use_passphrase: boolean;
          };
      }
    | {
          type: 'settings/general/change-language';
          payload: {
              language: AppState['suite']['settings']['language'];
          };
      }
    | {
          type: 'settings/general/change-fiat';
          payload: {
              fiat: string;
          };
      }
    | {
          type: 'router/location-change';
          payload: {
              prevRouterUrl: string;
              nextRouterUrl: string;
          };
      }
    | {
          type: 'session-end';
          payload: {
              // unix timestamp when session started
              start: number;
              // unix timestamp when session ended
              end: number;
          };
      }
    | {
          // fired when user manually enables analytics later in the app
          type: 'analytics/enable';
      }
    | {
          // fired when user manually disables analytics later in the app
          type: 'analytics/dispose';
      }
    | {
          // failed dry-run recovery any error ranging from disconnected device to wrong seed input
          type: 'check-seed/error';
          error?: string;
      }
    | {
          // successful dry-run
          type: 'check-seed/success';
      }
    | {
          type: 'wallet/created';
          payload: {
              type: 'hidden' | 'standard';
          };
      }
    | {
          type: 'desktop-init';
          payload: {
              // added in 1.6
              desktopOSVersion: string;
          };
      }
    | {
          type: 'transaction-created';
          payload: {
              // added in 1.9
              action: 'sent' | 'copied' | 'downloaded' | 'replaced';
              symbol: Account['symbol'];
              tokens: string;
              outputsCount: number;
              broadcast: boolean;
              bitcoinRbf: boolean;
              bitcoinLockTime: boolean;
              ethereumData: boolean;
              ethereumNonce: boolean;
              rippleDestinationTag: boolean;
              selectedFee: string;
          };
      }
    | {
          type: 'add-token';
          payload: {
              networkSymbol: Account['symbol'];
              addedNth: number; // if the user added 1st, 2nd,... token in his account
              // added in 1.9
              token: string;
          };
      }
    | {
          type: 'send-raw-transaction';
          payload: {
              networkSymbol: Account['symbol'];
          };
      };

const getUrl = () => {
    const hostname = getLocationHostname();
    const environment = getEnvironment();

    const base = `https://data.trezor.io/suite/log/${environment}`;

    if (process.env.CODESIGN_BUILD) {
        return `${base}/stable.log`;
    }

    // no reporting on localhost
    if (hostname === 'localhost') {
        return;
    }

    return `${base}/develop.log`;
};

export const report = (data: AnalyticsEvent, force = false) => (
    _dispatch: Dispatch,
    getState: GetState,
) => {
    const url = getUrl();

    // no reporting on localhost
    if (!url) {
        return;
    }

    const { enabled, sessionId, instanceId } = getState().analytics;
    const { initialRun } = getState().suite.flags;

    // don't report until user had chance to optout
    if (initialRun) {
        return;
    }

    // The only case we want to override users 'do not log' choice is
    // when we want to log that user did not give consent to logging.
    if (!enabled && !force) {
        return;
    }

    const qs = encodeDataToQueryString(data, { sessionId, instanceId, version });

    try {
        fetch(`${url}?${qs}`, {
            method: 'GET',
        });
    } catch (err) {
        // do nothing, just log error to sentry
        console.error('failed to log analytics', err);
    }
};

/**
 * Init analytics, should be always run on application start (see suiteMiddleware). It:
 * - sets common analytics variables based on what was loaded from storage
 * - initiates sentry
 * - registers event listeners for reporting events from electron
 * @param loadedState - analytics state loaded from storage
 * @param optout if true, analytics will be on by default (opt-out mode)
 */
export const init = (loadedState: State, optout: boolean) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    // 1. if instanceId does not exist yet (was not loaded from storage), create a new one
    const instanceId = loadedState.instanceId || getAnalyticsRandomId();
    // 2. always create new session id
    const sessionId = getAnalyticsRandomId();
    // 3. if enabled was already set to some value, keep it (user made choice), otherwise set it to default represented by optout param
    const enabled = typeof loadedState.enabled !== 'undefined' ? loadedState.enabled : optout;
    // 4. set application state
    dispatch({
        type: ANALYTICS.INIT,
        payload: {
            instanceId,
            sessionId,
            sessionStart: Date.now(),
            enabled,
        },
    });
    // 5. if analytics was initiated as enabled, continue with setting up side effects
    if (!getState().analytics.enabled) return;
    // 6. error logging to sentry
    setSentryUser(instanceId);
    // 7. register event listeners
    setOnBeforeUnloadListener(() => {
        dispatch(
            report({
                type: 'session-end',
                payload: {
                    start: getState().analytics.sessionStart!,
                    end: Date.now(),
                },
            }),
        );
    });

    // send OS type if isDesktop
    if (isDesktop()) {
        let desktopOSVersion = '';
        const resp = await getOsType();
        if (resp?.success) {
            desktopOSVersion = `${resp.payload.platform}_${resp.payload.release}`;
        }

        dispatch(
            report({
                type: 'desktop-init',
                payload: { desktopOSVersion },
            }),
        );
    }
};

export const enable = (): AnalyticsAction => ({
    type: ANALYTICS.ENABLE,
});

export const dispose = (): AnalyticsAction => ({
    type: ANALYTICS.DISPOSE,
});
