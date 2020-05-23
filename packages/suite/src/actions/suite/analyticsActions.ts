import { ANALYTICS } from '@suite-actions/constants';
import { isDev } from '@suite-utils/build';
import { Dispatch, GetState, AppState, TrezorDevice } from '@suite-types';
import { getAnalyticsRandomId } from '@suite-utils/random';
import { Account } from '@wallet-types';
import qs from 'qs';

export type AnalyticsActions =
    | { type: typeof ANALYTICS.DISPOSE }
    | { type: typeof ANALYTICS.INIT; payload: { instanceId: string } };

export type Payload =
    /*
    suite-ready
    Triggers on application start. Logs part of suite setup that might have been loaded from storage
    but it might also be suite default setup that is loaded when suite starts for the first time.
    */
    | {
          type: 'suite-ready';
          payload: {
              language: AppState['suite']['settings']['language'];
              enabledNetworks: AppState['wallet']['settings']['enabledNetworks'];
              localCurrency: AppState['wallet']['settings']['localCurrency'];
              discreetMode: AppState['wallet']['settings']['discreetMode'];
          };
      }
    | { type: 'transport-type'; payload: { type: string; version: string } }
    // device-connect
    // is logged when user connects device
    // - if device is not in bootloader, some of its features are logged
    | {
          type: 'device-connect';
          payload: {
              mode: TrezorDevice['mode'];
              firmware: string;
              pin_protection: boolean;
              passphrase_protection: boolean;
          };
      }
    // device-update-firmware
    // is log after firmware update call to device is finished.
    | {
          type: 'device-update-firmware';
          payload: {
              // version of bootloader before update started. unluckily fw version before update is not logged
              fromBlVersion: string;
              // version of the new firmware e.g 1.2.3
              toFwVersion: string;
              // is new firmware bitcoin only variant?
              toBtcOnly: boolean;
              // if finished with error, field error contains error string, otherwise is empty
              error: string;
          };
      }
    // - if device is in bootloader, only this event is logged
    | { type: 'device-connect'; payload: { mode: 'bootloader' } }
    // initial-run-completed
    // when new installation of trezor suite starts it is in initial-run mode which means that some additional screens appear (welcome, analytics, onboarding)
    // it is completed either by going trough onboarding or skipping it. once completed event is registered, we log some data connected up to this point
    | {
          type: 'initial-run-completed';
          payload: {
              analytics: false;
          };
      }
    | {
          type: 'initial-run-completed';
          payload: {
              analytics: true;
              // how many users chose to create new wallet
              createSeed: boolean;
              // how many users chose to do recovery
              recoverSeed: boolean;
              // how many users clicked that they have a new/used device
              newDevice: boolean;
              usedDevice: boolean;
          };
      }
    // account-create
    // logged either automatically upon each suite start as default switched on accounts are loaded
    // or when user adds account manually
    | {
          type: 'account-create';
          payload: {
              // normal, segwit, legacy
              type: Account['accountType'];
              // index of account
              path: Account['path'];
              // network (btc, eth, etc.)
              symbol: Account['symbol'];
          };
      }
    // ui
    // this is general category of click into ui.
    // every logged event has payload which describes where user clicked, for example payload: "menu/settings"
    // todo: make this also strongly typed?
    | {
          type: 'ui';
          payload: string;
      };

const getUrl = () => {
    // Real endpoints
    // --------------
    // https://data.trezor.io/suite/log/desktop/staging.log
    // https://data.trezor.io/suite/log/desktop/beta.log
    // https://data.trezor.io/suite/log/desktop/develop.log
    // https://data.trezor.io/suite/log/desktop/stable.log

    // https://data.trezor.io/suite/log/web/staging.log
    // https://data.trezor.io/suite/log/web/beta.log
    // https://data.trezor.io/suite/log/web/develop.log
    // https://data.trezor.io/suite/log/web/stable.log

    const base = 'https://data.trezor.io/suite/log';

    // todo: env variables that we might going to use ?
    // process.env.SUITE_TYPE   stands for web | desktop
    // process.env.BUILD        stands for development | beta | production ?
    // - currently, we do not have special beta or prod builds that would contain different features,
    // - so only hosting environment is important now

    if (process.env.SUITE_TYPE === 'desktop') {
        // currently released desktop version is in beta.
        return `${base}/desktop/beta.log`;
        // there is no staging for desktop version
    }

    // Intentionally pretty much verbose to be sure what is being sent where
    if (process.env.SUITE_TYPE === 'web') {
        // ts-ignores are "safe", we are in web env and I don't want to create custom file for native
        // @ts-ignore
        if (window.location.hostname === 'staging-wallet.trezor.io') {
            return `${base}/web/staging.log`;
        }
        // @ts-ignore
        if (window.location.hostname === 'beta-wallet.trezor.io') {
            return `${base}/web/beta.log`;
        }
        // @ts-ignore
        if (window.location.hostname === 'wallet.trezor.io') {
            return `${base}/web/stable.log`;
        }
    }

    return `${base}/${process.env.SUITE_TYPE}/develop.log`;
};

export const report = (data: Payload, force = false) => async (
    _dispatch: Dispatch,
    getState: GetState,
) => {
    if (isDev()) {
        // on dev, do nothing
        // return;
    }

    const { enabled, sessionId, instanceId } = getState().analytics;

    // the only case we want to override users 'do not log' choice is when we
    // want to log that user did not give consent to logging.
    if (!enabled && !force) {
        return;
    }

    // watched data is sent in query string
    const commonEncoded = qs.stringify({
        commit: process.env.COMMITHASH,
        sessionId,
        instanceId,
    });

    let eventSpecificEncoded;
    if (typeof data.payload !== 'string') {
        eventSpecificEncoded = qs.stringify(
            {
                type: data.type,
                ...data.payload,
            },
            {
                arrayFormat: 'comma',
            },
        );
    } else {
        eventSpecificEncoded = qs.stringify({
            type: data.type,
            payload: data.payload,
        });
    }

    const url = getUrl();

    if (!url) {
        console.warn('no endpoint for analytics found for this build and env');
        return;
    }

    try {
        fetch(`${url}?${commonEncoded}&${eventSpecificEncoded}`, {
            method: 'GET',
        });
    } catch (err) {
        // do nothing, just log error for sentry
        console.error('failed to log analytics', err);
    }
};

/**
 * Analytics life cycle
 *
 * 1. start app
 * 2. load analytics storage into reducer
 * 3. if empty (first start) generate instanceId and save it back to storage. instanceId exists in storage
 *     regardless of whether user enabled analytics or not.
 *
 * User may disable analytics, see dispose() fn.
 */
export const init = () => async (dispatch: Dispatch, getState: GetState) => {
    const { analytics } = getState();
    dispatch({
        type: ANALYTICS.INIT,
        payload: {
            // if no instanceId exists it means that it was not loaded from storage, so create a new one
            instanceId: !analytics.instanceId ? getAnalyticsRandomId() : analytics.instanceId,
        },
    });
};

export const dispose = () => ({
    type: ANALYTICS.DISPOSE,
});
