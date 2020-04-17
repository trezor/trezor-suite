import { ANALYTICS } from '@suite-actions/constants';
import { isDev } from '@suite-utils/build';
import { Dispatch, GetState } from '@suite-types';
import { getRandomId } from '@suite-utils/random';
import { Account } from '@wallet-types';

export type AnalyticsActions =
    | { type: typeof ANALYTICS.DISPOSE }
    | { type: typeof ANALYTICS.INIT; payload: { sessionId: string; instanceId: string } };

export type Payload =
    | {
          type: 'suite-ready';
          payload: {
              language: ReturnType<GetState>['suite']['settings']['language'];
              enabledNetworks: ReturnType<GetState>['wallet']['settings']['enabledNetworks'];
              localCurrency: ReturnType<GetState>['wallet']['settings']['localCurrency'];
              discreetMode: ReturnType<GetState>['wallet']['settings']['discreetMode'];
          };
      }
    | { type: 'transport-type'; payload: { type: string; version: string } }
    | { type: 'device-connect'; payload: { device_id: string; firmware: string } }
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
    | {
          type: 'account-create';
          payload: {
              type: Account['accountType'];
              path: Account['path'];
              symbol: Account['symbol'];
          };
      }
    | {
          type: 'ui';
          payload: string;
      };

const encodePayload = (data: Record<string, any>) => {
    return JSON.stringify(data);
};

const getUrl = () => {
    if (isDev()) {
        // I may run server on localhost to see if data flow as expected
        // return 'http://localhost:3001/';
    }

    // Temporarily, there is a server collecting and showing logged data. It helps
    // with development, data modeling and debugging.
    const base = 'https://track-suite.herokuapp.com/';

    // todo: later switch to real endpoint
    // Real endpoints
    // --------------
    // https://data.trezor.io/suite/log/desktop/beta.log
    // https://data.trezor.io/suite/log/desktop/develop.log
    // https://data.trezor.io/suite/log/desktop/stable.log
    // https://data.trezor.io/suite/log/web/beta.log
    // https://data.trezor.io/suite/log/web/develop.log
    // https://data.trezor.io/suite/log/web/stable.log

    // todo: env variables that we are going to use
    // process.env.SUITE_TYPE   stands for web | desktop
    // process.env.BUILD        stands for development | beta | production ?
    return `${base}/${process.env.SUITE_TYPE}/${process.env.BUILD}.log`;
};

export const report = (data: Payload, force = false) => async (
    _dispatch: Dispatch,
    getState: GetState,
) => {
    const { enabled, sessionId, instanceId } = getState().analytics;

    // the only case we want to override users 'do not log' choice is when we
    // want to log that user did not give consent to logging.
    if (!enabled && !force) {
        return;
    }

    if (isDev()) {
        // on dev, do nothing
        return;
    }
    const url = getUrl();
    const payload = encodePayload({
        ...data,
        version: process.env.COMMITHASH,
        sessionId,
        instanceId,
        ts: Date.now(),
    });

    try {
        fetch(url, {
            method: 'POST',
            headers: new Headers({
                'content-type': 'application/json',
            }),
            body: payload,
        });
    } catch (err) {
        // do nothing
    }
};

/**
 * Analytics life cycle
 *
 * 1. start app
 * 2. load analytics storage into reducer
 * 3a] if empty (first start) generate instanceId and save it back to storage. instanceId exists in storage
 *     regardless of whether user enabled analytics or not.
 * 3b] if analytics enabled, only generate sessionId which is unique for each analytics session
 * 3c] if analytics is disabled, do nothing
 *
 * User may disable analytics, see dispose() fn. This flushes data from reducer and clears
 * sessionId from storage (instanceId is kept)
 */
export const init = () => async (dispatch: Dispatch, getState: GetState) => {
    const { analytics } = getState();
    dispatch({
        type: ANALYTICS.INIT,
        payload: {
            // if no instanceId exists it means that it was not loaded from storage, so create a new one
            instanceId: analytics.instanceId ? analytics.instanceId : getRandomId(10),
            // sessionId is always ephemeral
            sessionId: getRandomId(10),
        },
    });
};

export const dispose = () => ({
    type: ANALYTICS.DISPOSE,
});
