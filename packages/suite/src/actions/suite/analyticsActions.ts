import { SUITE } from '@suite-actions/constants';
import { isDev } from '@suite-utils/build';
import { Dispatch, GetState } from '@suite-types';

type Payload =
    | // which transport was initiated on suite start
    { type: 'transport-type'; payload: { type: string; version: string } }
    | { type: 'device-connect'; payload: { device_id: string; firmware: string } }
    // in case user does not allow analytics, we just log this information and nothing else
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
      };

const encodePayload = (data: Payload) => {
    return JSON.stringify({ ...data, version: process.env.COMMITHASH });
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

// the only case we want to override users 'do not log' choice is when we
// want to log that user did not give consent to logging.
export const report = (data: Payload, force = false) => async (
    _dispatch: Dispatch,
    getState: GetState,
) => {
    const { analytics } = getState().suite.settings;
    if (!analytics && !force) {
        return;
    }
    if (isDev()) {
        // on dev, do nothing
        return;
    }
    const url = getUrl();
    const payload = encodePayload(data);

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

export const toggleAnalytics = () => ({
    type: SUITE.TOGGLE_ANALYTICS,
});
