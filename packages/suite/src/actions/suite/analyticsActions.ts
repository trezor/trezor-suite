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
              //   backupError: string | undefined;
              recoveryError: string | undefined;
              firmwareError: string | undefined;
          };
      };

const encodePayload = (data: Payload) => {
    // return encodeURI(JSON.stringify(data));
    return JSON.stringify({ ...data, version: process.env.COMMITHASH });
};

// Real endpoints
// --------------
// https://data.trezor.io/suite/log/desktop/beta.log
// https://data.trezor.io/suite/log/desktop/develop.log
// https://data.trezor.io/suite/log/desktop/stable.log
// https://data.trezor.io/suite/log/web/beta.log
// https://data.trezor.io/suite/log/web/develop.log
// https://data.trezor.io/suite/log/web/stable.log

const getUrl = () => {
    if (isDev()) {
        // return 'http://localhost:3001/';
        return 'https://track-suite.herokuapp.com/'; // there we may check some ephemeral but real data, just for developing purposes
    }
    const base = 'https://track-suite.herokuapp.com/';
    // const base = 'https://data.trezor.io/suite/log';
    // process.env.SUITE_TYPE   stands for web | desktop
    // process.env.BUILD        stands for development | beta | production ?
    return `${base}/${process.env.SUITE_TYPE}/${process.env.BUILD}.log`;
};

export const report = (data: Payload) => async () => {
    const url = getUrl();
    const payload = encodePayload(data);
    if (isDev()) {
        // return console.log('[skipping analytics report in dev]', payload)
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
        console.error(err);
    }
};

export const toggleAnalytics = () => ({
    type: SUITE.TOGGLE_ANALYTICS,
});
