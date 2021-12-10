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

jest.mock('@suite-actions/routerActions', () => ({
    goto: () => ({ type: 'mock-redirect' }),
}));

jest.mock('react-svg', () => ({ ReactSVG: () => 'SVG' }));

// render only Translation['id']
jest.mock('@suite-components/Translation', () => ({ Translation: ({ id }: any) => id }));

jest.mock('trezor-connect', () => global.JestMocks.getTrezorConnect({}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TrezorConnect = require('trezor-connect').default;

type SendState = ReturnType<typeof sendFormReducer>;
interface Args {
    send?: Partial<SendState>;
    fees?: any;
    selectedAccount?: any;
}

export const getInitialState = ({ send, fees, selectedAccount }: Args = {}) => ({
    ...fixtures.DEFAULT_STORE,
    wallet: {
        ...fixtures.DEFAULT_STORE.wallet,
        send: {
            ...sendFormReducer(undefined, { type: 'foo' } as any),
            ...send,
        },
        fees: {
            ...fixtures.DEFAULT_STORE.wallet.fees,
            ...fees,
        },
        selectedAccount: selectedAccount ?? fixtures.DEFAULT_STORE.wallet.selectedAccount,
    },
    devices: [],
    resize: resizeReducer(undefined, { type: 'foo' } as any),
    guide: {},
});

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
    estimateFeeCalls?: number; // used in ETH
    estimateFeeParams?: any; // partial trezor-connect params
    getAccountInfoCalls?: number; // used in XRP
    getAccountInfoParams?: any; // partial trezor-connect params
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
    if (typeof result.estimateFeeCalls === 'number') {
        expect(TrezorConnect.blockchainEstimateFee).toBeCalledTimes(result.estimateFeeCalls);
    }
    if (typeof result.getAccountInfoCalls === 'number') {
        expect(TrezorConnect.getAccountInfo).toBeCalledTimes(result.getAccountInfoCalls);
    }

    // validate 'trezor-connect' params
    if (result.composeTransactionParams) {
        expect(TrezorConnect.composeTransaction).toHaveBeenLastCalledWith(
            expect.objectContaining(result.composeTransactionParams),
        );
    }
    if (result.estimateFeeParams) {
        expect(TrezorConnect.blockchainEstimateFee).toHaveBeenLastCalledWith(
            expect.objectContaining(result.estimateFeeParams),
        );
    }
    if (result.getAccountInfoParams) {
        expect(TrezorConnect.getAccountInfo).toHaveBeenLastCalledWith(
            expect.objectContaining(result.getAccountInfoParams),
        );
    }

    const { composedLevels, getValues, errors } = getContextValues();

    // validate composedLevels object
    if (Object.prototype.hasOwnProperty.call(result, 'composedLevels')) {
        if (result.composedLevels && composedLevels) {
            Object.keys(result.composedLevels).forEach(key => {
                const expectedLevel = result.composedLevels[key];
                const level = composedLevels[key];
                if (expectedLevel) {
                    expect(level).toMatchObject(expectedLevel);
                } else {
                    expect(level).toBe(undefined);
                }
            });
            // expect(composedLevels).toMatchObject(result.composedLevels);
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
        // expect(errors).toMatchObject(result.errors);
        Object.keys(result.errors).forEach(key => {
            const expectedError = result.errors[key];
            // @ts-ignore key: string
            const error = errors[key];
            if (expectedError) {
                expect(error).toMatchObject(expectedError);
            } else {
                expect(error).toBe(undefined);
            }
        });
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

    fixtures.signAndPush.forEach(f => {
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

            store.subscribe(() => {
                const actions = store.getActions();
                const lastAction = actions[actions.length - 1];
                if (lastAction.payload?.decision) {
                    lastAction.payload.decision.resolve(true); // always resolve push tx request
                }
            });

            await actionSequence([{ type: 'click', element: '@send/review-button' }], () => {
                const actions = store.getActions();
                f.result.actions.forEach((action: any) => {
                    expect(actions.find(a => a.type === action.type)).toMatchObject(action);
                });
                actionCallback(callback, { result: f.result });
            });

            unmount();
        });
    });

    fixtures.feeChange.forEach(f => {
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
            await actionSequence(f.actionSequence, a => actionCallback(callback, a));

            // validate finalResult
            actionCallback(callback, { result: f.finalResult });

            unmount();
        });
    });
});
