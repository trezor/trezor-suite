import { SUITE } from '@suite-actions/constants';
import { isDev } from '@suite-utils/build';

type Payload =
    | // which transport was initiated on suite start
    { type: 'transport-type'; payload: { type: string; version: string } }
    | { type: 'device-connect'; payload: { device_id: string; firmware: string } }
    | {
          type: 'initial-run-completed';
          payload: {
              analytics: boolean;
              createSeed: boolean;
              recoverSeed: boolean;
              newDevice: boolean;
              usedDevice: boolean;
              recoveryError: string | undefined;
              firmwareError: string | undefined;
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

export const report = (data: Payload) => async () => {
    const url = getUrl();
    const payload = encodePayload(data);
    if (isDev()) {
        // on dev, do nothing
        return;
    }
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
