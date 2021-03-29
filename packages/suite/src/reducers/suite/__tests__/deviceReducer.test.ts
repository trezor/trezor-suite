import deviceReducer, { isUnlocked } from '@suite-reducers/deviceReducer';

import { Action } from '@suite-types';
import { getDeviceFeatures } from '@suite/support/tests/setupJest';
import fixtures from '../__fixtures__/deviceReducer';

type State = ReturnType<typeof deviceReducer>;

describe('isUnlocked', () => {
    it('when unlocked is present it is used', () => {
        expect(isUnlocked(getDeviceFeatures({ unlocked: true, pin_protection: true }))).toBe(true);
        expect(isUnlocked(getDeviceFeatures({ unlocked: false, pin_protection: true }))).toBe(
            false,
        );
    });
    it('missing unlocked signifies unlocked device', () => {
        expect(isUnlocked(getDeviceFeatures({ unlocked: undefined, pin_protection: true }))).toBe(
            true,
        );
    });
});

describe('DEVICE.CONNECT', () => {
    fixtures.connect.forEach(f => {
        it(f.description, () => {
            let state: State = f.initialState;
            // console.log('initialSTATE', state);
            f.actions.forEach(a => {
                state = deviceReducer(state, a as Action);
            });
            // console.log('afterSTATE', state);
            expect(state.length).toEqual(f.result.length);
            state.forEach((device, i) => {
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
                state = deviceReducer(state, a as Action);
            });
            expect(state.length).toEqual(f.result.length);
            state.forEach((device, i) => {
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
                state = deviceReducer(state.length === 0 ? undefined : state, a as Action);
            });
            expect(state.length).toEqual(f.result.length);
            state.forEach((device, i) => {
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
                state = deviceReducer(state, a as Action);
            });
            expect(state.length).toEqual(f.result.length);
            // console.log('afterSTATE', state);
            state.forEach((device, i) => {
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
                state = deviceReducer(state, a as Action);
            });
            expect(state.length).toEqual(f.result.length);
            state.forEach((device, i) => {
                expect(device).toMatchObject(f.result[i]);
            });
        });
    });
});

describe('SUITE.AUTH_DEVICE', () => {
    fixtures.authDevice.forEach(f => {
        it(f.description, () => {
            let state: State = f.initialState;
            f.actions.forEach(a => {
                state = deviceReducer(state, a as Action);
            });
            expect(state.length).toEqual(f.result.length);
            state.forEach((device, i) => {
                expect(device).toMatchObject(f.result[i]);
            });
        });
    });
});

describe('SUITE.CREATE_DEVICE_INSTANCE', () => {
    fixtures.createInstance.forEach(f => {
        it(f.description, () => {
            let state: State = f.initialState;
            f.actions.forEach(a => {
                state = deviceReducer(state, a as Action);
            });
            expect(state.length).toEqual(f.result.length);
            state.forEach((device, i) => {
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
                state = deviceReducer(state, a as Action);
            });
            expect(state.length).toEqual(f.result.length);
            state.forEach((device, i) => {
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
                state = deviceReducer(state, a as Action);
            });
            expect(state.length).toEqual(f.result.length);
            state.forEach((device, i) => {
                expect(device).toMatchObject(f.result[i]);
            });
        });
    });
});
