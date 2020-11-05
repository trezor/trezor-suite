import React from 'react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { DeepPartial } from 'react-hook-form';
import * as fixtures from '../__fixtures__/useSendForm';
import sendFormReducer from '@wallet-reducers/sendFormReducer';
import resizeReducer from '@suite-reducers/resizeReducer';
import {
    renderWithProviders,
    waitForLoader,
    findByTestId,
    UserAction,
    actionSequence,
} from '@suite/support/tests/hooksHelper';

import { SendContextValues } from '@wallet-types/sendForm';
import SendIndex from '@wallet-views/send';
import { useSendFormContext } from '../useSendForm';

jest.mock('react-svg', () => {
    return { ReactSVG: () => 'SVG' };
});

// render only Translation['id']
jest.mock('@suite-components/Translation', () => {
    return { Translation: ({ id }: any) => id };
});

jest.mock('trezor-connect', () => {
    return global.JestMocks.getTrezorConnect({});
});
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TrezorConnect = require('trezor-connect').default;

type SendState = ReturnType<typeof sendFormReducer>;
interface Args {
    send?: Partial<SendState>;
}

export const getInitialState = ({ send }: Args = {}) => {
    return {
        ...fixtures.DEFAULT_STORE,
        wallet: {
            ...fixtures.DEFAULT_STORE.wallet,
            send: {
                ...sendFormReducer(undefined, { type: 'foo' } as any),
                ...send,
            },
        },
        devices: [],
        resize: resizeReducer(undefined, { type: 'foo' } as any),
    };
};

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>([thunk]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const prevState = store.getState();
        store.getState().wallet.send = sendFormReducer(prevState.wallet.send, action);
        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

interface TestCallback {
    getContextValues?: () => SendContextValues;
}
// component rendered inside of SendIndex
// callback prop is an object passed from single test case
// getContextValues returns actual state of SendFormContext
const Component = ({ callback }: { callback: TestCallback }) => {
    const values = useSendFormContext();
    callback.getContextValues = () => values;
    return values.isLoading ? <div>Loading</div> : null;
};

interface Result {
    composeTransactionCalls?: number;
    composeTransactionParams?: any; // partial trezor-connect params
    composedLevels?: any; // partial PrecomposedLevel
    formValues?: DeepPartial<ReturnType<SendContextValues['getValues']>>;
    errors?: any; // partial SendContextValues['errors']
}

// common validation method
// it's called on every action in action sequence
const actionCallback = (
    { getContextValues }: TestCallback,
    { result }: Partial<UserAction<Result>>,
) => {
    if (!result || !getContextValues) return;

    // validate number of calls to 'trezor-connect'
    if (typeof result.composeTransactionCalls === 'number') {
        expect(TrezorConnect.composeTransaction).toBeCalledTimes(result.composeTransactionCalls);
    }

    // validate 'trezor-connect' params
    if (result.composeTransactionParams) {
        expect(TrezorConnect.composeTransaction).toHaveBeenLastCalledWith(
            expect.objectContaining(result.composeTransactionParams),
        );
    }

    const { composedLevels, getValues, errors } = getContextValues();

    // validate composedLevels object
    if (Object.prototype.hasOwnProperty.call(result, 'composedLevels')) {
        if (result.composedLevels) {
            expect(composedLevels).toMatchObject(result.composedLevels);
        } else {
            expect(composedLevels).toBe(undefined);
        }
    }

    // validate form values
    if (result.formValues) {
        expect(getValues()).toMatchObject(result.formValues);
    }

    // validate errors
    if (result.errors) {
        expect(errors).toMatchObject(result.errors);
    }
};

describe('useSendForm hook', () => {
    beforeEach(() => {
        jest.setTimeout(30000); // action sequences takes time
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    fixtures.addingOutputs.forEach(f => {
        it(f.description, async () => {
            const store = initStore(getInitialState(f.store));
            const callback: TestCallback = {};
            const { unmount } = renderWithProviders(
                store,
                <SendIndex>
                    <Component callback={callback} />
                </SendIndex>,
            );

            // wait for first render
            await waitForLoader();
            if (!callback.getContextValues) throw Error('callback.getContextValues missing');

            // check HTML elements after first render
            expect(findByTestId(/outputs\[.*\].address/).length).toBe(f.initial.outputs.length);
            expect(callback.getContextValues().getValues()).toMatchObject(f.initial);

            await actionSequence(f.actions, a => {
                // check rendered HTML elements (Output.address input)
                expect(findByTestId(/outputs\[.*\].address/).length).toBe(
                    a.result.formValues.outputs.length,
                );
                // validate action result
                actionCallback(callback, a);
            });

            unmount();
        });
    });

    fixtures.setMax.forEach(f => {
        it(f.description, async () => {
            TrezorConnect.setTestFixtures(f.connect);
            const store = initStore(getInitialState(f.store));
            const callback: TestCallback = {};
            const { unmount } = renderWithProviders(
                store,
                <SendIndex>
                    <Component callback={callback} />
                </SendIndex>,
            );

            // wait for first render
            await waitForLoader();

            // execute user actions sequence
            if (f.actions) {
                await actionSequence(f.actions, a => actionCallback(callback, a));
            }

            // validate finalResult
            actionCallback(callback, { result: f.finalResult });

            unmount();
        });
    });

    fixtures.composeDebouncedTransaction.forEach(f => {
        it(f.description, async () => {
            TrezorConnect.setTestFixtures(f.connect);
            const store = initStore(getInitialState());
            const callback: TestCallback = {};
            const { unmount } = renderWithProviders(
                store,
                <SendIndex>
                    <Component callback={callback} />
                </SendIndex>,
            );

            // execute user actions sequence
            if (f.actions) {
                await actionSequence(f.actions, a => actionCallback(callback, a));
            }

            // validate finalResult
            actionCallback(callback, { result: f.finalResult });

            unmount();
        });
    });
});
