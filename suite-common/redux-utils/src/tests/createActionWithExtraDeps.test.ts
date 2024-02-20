import { configureStore, createReducer } from '@reduxjs/toolkit';

import { createActionWithExtraDeps } from '../createActionWithExtraDeps';

const dummyAction = createActionWithExtraDeps(
    'dummyAction',
    (payload: { greetings: string }, { extra, getState }) => ({
        ...payload,
        currency: extra.selectors.selectLocalCurrency(getState()),
    }),
);

const dummyReducer = createReducer({ greetings: 'ciao', currency: 'czk' }, builder => {
    builder.addCase(dummyAction, (state, action) => {
        state.greetings = action.payload.greetings;
        state.currency = action.payload.currency;
    });
});

const extraDependencies = {
    selectors: {
        selectLocalCurrency: (_state: any) => 'usd',
    },
};

const initStore = () => {
    const store = configureStore({
        reducer: { dummy: dummyReducer },
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({
                thunk: {
                    extraArgument: extraDependencies,
                },
                serializableCheck: false,
                immutableCheck: false,
            }),
    });

    return store;
};

describe('createActionWithExtraDeps', () => {
    it('is correctly created with extra deps', () => {
        const store = initStore();
        const action = store.dispatch(
            dummyAction({
                greetings: 'bella ciao',
            }),
        );
        expect(action).toEqual({
            type: 'dummyAction',
            payload: {
                greetings: 'bella ciao',
                currency: 'usd',
            },
        });
    });

    it('is dispatched and reducer updated', () => {
        const store = initStore();
        store.dispatch(
            dummyAction({
                greetings: 'bella ciao',
            }),
        );
        expect(store.getState().dummy).toEqual({
            greetings: 'bella ciao',
            currency: 'usd',
        });
    });

    it('has correct utility functions', () => {
        expect(dummyAction.type).toEqual('dummyAction');
        expect(dummyAction.toString()).toEqual('dummyAction');
        expect(dummyAction.match({ type: 'dummyAction' })).toEqual(true);
    });

    it('has correct types', () => {
        const store = initStore();

        // @ts-expect-error - this is expected to fail payload shound be empty
        store.dispatch(dummyAction());

        // @ts-expect-error - this is expected to fail, `currency` is injected by extra deps in payload creator
        store.dispatch(dummyAction({ currency: 'eur' }));

        // @ts-expect-error - this is expected to fail, there is no `blahblah` in payload
        store.dispatch(dummyAction({ blahblah: 'blahblah', greetings: 'bella ciao' }));
    });
});
