import { configureStore, createReducer } from '@reduxjs/toolkit';

import { createActionWithExtraDeps } from '../createActionWithExtraDeps';

const dummyAction = createActionWithExtraDeps(
    'dummyAction',
    (payload: { greetings: string }, { extra, getState }) => ({
        ...payload,
        language: extra.selectors.selectLanguage(getState()),
    }),
);

const dummyReducer = createReducer({ greetings: 'ciao', language: 'it' }, builder => {
    builder.addCase(dummyAction, (state, action) => {
        state.greetings = action.payload.greetings;
        state.language = action.payload.language;
    });
});

const extraDependencies = {
    selectors: {
        selectLanguage: (_state: any) => 'en',
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
                language: 'en',
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
            language: 'en',
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

        // @ts-expect-error - this is expected to fail, `language` is injected by extra deps in payload creator
        store.dispatch(dummyAction({ language: 'cz' }));

        // @ts-expect-error - this is expected to fail, there is no `blahblah` in payload
        store.dispatch(dummyAction({ blahblah: 'blahblah', greetings: 'bella ciao' }));
    });
});
