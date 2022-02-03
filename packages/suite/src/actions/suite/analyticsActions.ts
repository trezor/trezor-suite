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
import { setOnBeforeUnloadListener, getEnvironment } from '@suite-utils/env';
import { allowSentryReport, setSentryUser } from '@suite-utils/sentry';
import { State } from '@suite-reducers/analyticsReducer';
import { DeviceMode } from 'trezor-connect';

import type { OnboardingAnalytics } from '@onboarding-types';

export type AnalyticsAction =
    | { type: typeof ANALYTICS.ENABLE }
    | { type: typeof ANALYTICS.DISPOSE }
    | {
          type: typeof ANALYTICS.INIT;
          payload: {
              instanceId: string;
              sessionId: string;
              enabled: boolean;
              confirmed: boolean;
              sessionStart: number;
          };
      };

// Don't forget to update docs with changelog!
// <breaking-change>.<analytics-extended>
export const version = '1.16';

export type AnalyticsEvent =
    | {
          /**
         suite-ready
         Triggers on application start. Logs part of suite setup that might have been loaded from storage
         but it might also be suite default setup that is loaded when suite starts for the first time.
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
              // added in 1.15
              earlyAccessProgram: boolean;
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
          /**
           * accounts/status
           * - logged when discovery is completed (app start, coin added, account added)
           * - sends number of accounts having at least 1 transaction grouped by '[symbol]_[accountType]' (e.g. 'btc_segwit')
           */
          type: 'accounts/status';
          payload: {
              [key: string]: number;
          };
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
          type: 'device-setup-completed';
          payload: Partial<Omit<OnboardingAnalytics, 'startTime'>> & {
              duration: number;
              device: 'T' | '1';
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
          type: 'menu/goto/early-access';
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
          type: 'guide/tooltip-link/navigation';
          payload: {
              id: string;
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
    | { type: 'switch-device/add-hidden-wallet' }
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
          type: 'settings/general/early-access';
          payload: {
              allowPrerelease: boolean;
          };
      }
    | {
          type: 'settings/general/early-access/check-for-updates';
          payload: {
              checkNow: boolean;
          };
      }
    | {
          type: 'settings/general/early-access/download-stable';
      }
    | {
          type: 'settings/general/goto/early-access';
          payload: {
              allowPrerelease: boolean;
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
          type: 'select-wallet-type';
          payload: {
              type: 'hidden' | 'standard';
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
    const environment = getEnvironment();

    const base = `https://data.trezor.io/suite/log/${environment}`;

    if (process.env.CODESIGN_BUILD) {
        return `${base}/stable.log`;
    }

    return `${base}/develop.log`;
};

export const report =
    (data: AnalyticsEvent, force = false) =>
    (_dispatch: Dispatch, getState: GetState) => {
        const url = getUrl();

        // no reporting on localhost
        if (!url) {
            return;
        }

        const { enabled, sessionId, instanceId, confirmed } = getState().analytics;

        // don't report until user confirmed his choice
        if (!confirmed) {
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
 * - set sentry user id
 * - registers event listeners for reporting events from electron
 * @param loadedState - analytics state loaded from storage
 */
export const init = (loadedState: State) => (dispatch: Dispatch, getState: GetState) => {
    // if instanceId does not exist yet (was not loaded from storage), create a new one
    const instanceId = loadedState.instanceId || getAnalyticsRandomId();
    // always create new session id
    const sessionId = getAnalyticsRandomId();
    // if user made choice, keep it, otherwise set it to true by default just to prefill the confirmation toggle
    const confirmed = !!loadedState.confirmed;
    const enabled = confirmed ? !!loadedState.enabled : true;
    // set application state
    dispatch({
        type: ANALYTICS.INIT,
        payload: {
            instanceId,
            sessionId,
            sessionStart: Date.now(),
            enabled,
            confirmed,
        },
    });
    // allow sentry reporting only if user already confirmed enabling of analytics
    const userAllowedAnalytics = confirmed && enabled;
    allowSentryReport(userAllowedAnalytics);
    // set sentry user id same as session id for analytics
    setSentryUser(instanceId);
    // if analytics was initiated as enabled, continue with setting up side effects
    if (!getState().analytics.enabled) return;
    // register event listeners to report end of session
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
};

export const enable = (): AnalyticsAction => ({
    type: ANALYTICS.ENABLE,
});

export const dispose = (): AnalyticsAction => ({
    type: ANALYTICS.DISPOSE,
});
