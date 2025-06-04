import { prepareDeviceReducer } from '@suite-common/wallet-core';

import { extraDependencies } from 'src/support/extraDependencies';

import fixtures from '../__fixtures__/deviceReducer';

const deviceReducer = prepareDeviceReducer(extraDependencies);

type State = ReturnType<typeof deviceReducer>;

describe('DEVICE.CONNECT', () => {
    fixtures.connect.forEach(f => {
        it(f.description, () => {
            let state: State = f.initialState;
            // console.log('initialSTATE', state);
            f.actions.forEach(a => {
                state = deviceReducer(state, a);
            });
            // console.log('afterSTATE', state);
            expect(state.devices.length).toEqual(f.result.length);
            state.devices.forEach((device, i) => {
                expect(device).toMatchObject(f.result[i]);
            });
        });
    });
});

describe('DEVICE.CHANGED', () => {
    fixtures.changed.forEach(f => {
        it(f.description, () => {
            let state: State = f.initialState;
            f.actions.forEach(a => {
                state = deviceReducer(state, a);
            });
            expect(state.devices.length).toEqual(f.result.length);
            state.devices.forEach((device, i) => {
                expect(device).toMatchObject(f.result[i]);
            });
        });
    });
});

describe('DEVICE.DISCONNECT', () => {
    fixtures.disconnect.forEach(f => {
        it(f.description, () => {
            let state: State = f.initialState;
            f.actions.forEach(a => {
                // intentionally use "undefined" as state to cover "initialState" line inside reducer
                state = deviceReducer(state.devices.length === 0 ? undefined : state, a);
            });
            expect(state.devices.length).toEqual(f.result.length);
            state.devices.forEach((device, i) => {
                expect(device).toMatchObject(f.result[i]);
            });
        });
    });
});

describe('SUITE.SELECT_DEVICE', () => {
    fixtures.updateTimestamp.forEach(f => {
        it(f.description, () => {
            let state: State = f.initialState;
            f.actions.forEach(a => {
                state = deviceReducer(state, a);
            });
            expect(state.devices.length).toEqual(f.result.length);
            // console.log('afterSTATE', state);
            state.devices.forEach((device, i) => {
                expect(device).toMatchObject(f.result[i]);
                if (f.ts[i] > 0) {
                    expect(device.ts).toBeGreaterThan(0);
                } else {
                    expect(device.ts).toEqual(0);
                }
            });
        });
    });
});

describe('SUITE.UPDATE_PASSPHRASE_MODE', () => {
    fixtures.changePassphraseMode.forEach(f => {
        it(f.description, () => {
            let state: State = f.initialState;
            f.actions.forEach(a => {
                state = deviceReducer(state, a);
            });
            expect(state.devices.length).toEqual(f.result.length);
            state.devices.forEach((device, i) => {
                expect(device).toMatchObject(f.result[i]);
            });
        });
    });
});

describe('SUITE.FORGET_DEVICE', () => {
    fixtures.forget.forEach(f => {
        it(f.description, () => {
            let state: State = f.initialState;
            f.actions.forEach(a => {
                state = deviceReducer(state, a);
            });
            expect(state.devices.length).toEqual(f.result.length);
            state.devices.forEach((device, i) => {
                expect(device).toMatchObject(f.result[i]);
            });
        });
    });
});

describe('SUITE.REMEMBER_DEVICE', () => {
    fixtures.remember.forEach(f => {
        it(f.description, () => {
            let state: State = f.initialState;
            f.actions.forEach(a => {
                state = deviceReducer(state, a);
            });
            expect(state.devices.length).toEqual(f.result.length);
            state.devices.forEach((device, i) => {
                expect(device).toMatchObject(f.result[i]);
            });
        });
    });
});
