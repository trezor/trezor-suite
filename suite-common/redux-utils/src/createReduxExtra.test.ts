import { configureStore } from '@reduxjs/toolkit';

import { createReduxExtra } from './createReduxExtra';

const createTestDeps = () => {
    const reduxExtra = createReduxExtra<number, { getValue: () => number }, { prefix: string }>({
        extraDependencies: { prefix: 'value' },
    });
    const store = configureStore({
        reducer: (state = 1) => state,
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({ thunk: false }).prepend(reduxExtra.thunkMiddleware),
    });

    return { store, ...reduxExtra };
};

describe(createReduxExtra.name, () => {
    it('rejects application actions before services are injected', () => {
        const { store } = createTestDeps();

        expect(() => store.dispatch({ type: 'test' })).toThrow(
            'Redux services must be injected before dispatching application actions.',
        );
    });

    it('provides state, dispatch and injected dependencies to thunks', () => {
        const { store, getExtra, injectServicesIntoReduxExtra } = createTestDeps();
        const services = { getValue: () => 2 };
        injectServicesIntoReduxExtra(services);

        const result = store.dispatch((dispatch, getState, extra) => {
            dispatch({ type: 'test' });

            return `${extra.prefix}: ${getState() + extra.services.getValue()}`;
        });

        expect(result).toBe('value: 3');
        expect(getExtra()).toEqual({ prefix: 'value', services });
    });

    it('keeps injected services isolated between store instances', () => {
        const first = createTestDeps();
        const second = createTestDeps();
        first.injectServicesIntoReduxExtra({ getValue: () => 2 });

        expect(() => second.getExtra()).toThrow();
        second.injectServicesIntoReduxExtra({ getValue: () => 3 });
        expect(first.getExtra().services.getValue()).toBe(2);
        expect(second.getExtra().services.getValue()).toBe(3);
    });
});
