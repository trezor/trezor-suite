/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable global-require */

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fixtures from '../__fixtures__/deviceSettings';

const { getSuiteDevice } = global.JestMocks;

jest.mock('trezor-connect', () => {
    let fixture: any;

    return {
        __esModule: true, // this property makes it work
        default: {
            blockchainSetCustomBackend: () => {},
            applySettings: () => Promise.resolve(fixture),
            wipeDevice: () => Promise.resolve(fixture),
            changePin: () => Promise.resolve(fixture),
        },
        setTestFixtures: (f: any) => {
            fixture = f;
        },
        DEVICE: {
            CHANGED: 'device-changed',
        },
    };
});

export const getInitialState = (): any => {
    const device = getSuiteDevice();
    return {
        suite: { device },
        devices: [device],
    };
};
const mockStore = configureStore<ReturnType<typeof getInitialState>, any>([thunk]);

describe('DeviceSettings Actions', () => {
    fixtures.forEach(f => {
        it(f.description, async () => {
            if (f.mocks) {
                require('trezor-connect').setTestFixtures(f.mocks);
            }

            const state = getInitialState();
            const store = mockStore(state);
            await store.dispatch(f.action());

            if (f.result) {
                if (f.result.actions) {
                    expect(store.getActions()).toMatchObject(f.result.actions);
                }
            }
        });
    });
});
