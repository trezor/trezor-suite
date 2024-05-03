import { useState, useEffect } from 'react';
import { DeepPartial } from 'react-hook-form';

import { configureMockStore, initPreloadedState, testMocks } from '@suite-common/test-utils';
import { PROTO } from '@trezor/connect';

import { filterThunkActionTypes } from 'src/support/tests/configureStore';
import {
    renderWithProviders,
    waitForLoader,
    findByTestId,
    UserAction,
    actionSequence,
} from 'src/support/tests/hooksHelper';
import { FormState, SendContextValues } from '@suite-common/wallet-types';
import SendIndex from 'src/views/wallet/send';

import * as fixtures from '../__fixtures__/useSendForm';
import { useSendFormContext } from '../useSendForm';
import { act, waitFor } from '@testing-library/react';

const TEST_TIMEOUT = 30000;

global.ResizeObserver = class MockedResizeObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
};

jest.mock('src/actions/suite/routerActions', () => ({
    goto: () => ({ type: 'mock-redirect' }),
}));

// render only Translation['id']
jest.mock('src/components/suite/Translation', () => ({ Translation: ({ id }: any) => id }));

type RootReducerState = ReturnType<ReturnType<typeof fixtures.getRootReducer>>;
interface Args {
    send?: Partial<RootReducerState['wallet']['send']>;
    fees?: any;
    selectedAccount?: any;
    coinjoin?: any;
    bitcoinAmountUnit?: PROTO.AmountUnit;
}

const TrezorConnect = testMocks.getTrezorConnectMock();

const initStore = ({ send, fees, selectedAccount, coinjoin, bitcoinAmountUnit }: Args = {}) => {
    const rootReducer = fixtures.getRootReducer(selectedAccount, fees);

    const preloadedState = initPreloadedState({
        rootReducer,
        partialState: {
            wallet: {
                send,
                coinjoin,
                settings: { bitcoinAmountUnit, enabledNetworks: ['thol'] },
            },
        },
    });

    return configureMockStore({
        reducer: rootReducer,
        preloadedState,
        // NOTE: this action contains `decision` callback which is not serializable
        serializableCheck: { ignoredActions: ['@modal/open-user-context'] },
    });
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

    // NOTE: rendering briefly explanation:
    // sendForm.state.isLoading field is updated **BEFORE** last render of react-hook-form
    // results are verified **BEFORE** components are finally rerendered.
    // force additional re-render here (using state update) before removing loader from the view
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        setLoading(values.isLoading);
    }, [loading, values.isLoading]);

    return loading ? <div>Loading</div> : null;
};

interface Result {
    composeTransactionCalls?: number;
    composeTransactionParams?: any; // partial @trezor/connect params
    estimateFeeCalls?: number; // used in ETH
    estimateFeeParams?: any; // partial @trezor/connect params
    getAccountInfoCalls?: number; // used in XRP
    getAccountInfoParams?: any; // partial @trezor/connect params
    composedLevels?: any; // partial PrecomposedLevel
    formValues?: DeepPartial<FormState>;
    errors?: any; // partial SendContextValues['errors']
}

// common validation method
// it's called on every action in action sequence
const actionCallback = (
    { getContextValues }: TestCallback,
    { result }: Partial<UserAction<Result>>,
) => {
    if (!result || !getContextValues) return;

    // validate number of calls to '@trezor/connect'
    if (typeof result.composeTransactionCalls === 'number') {
        expect(TrezorConnect.composeTransaction).toHaveBeenCalledTimes(
            result.composeTransactionCalls,
        );
    }
    if (typeof result.estimateFeeCalls === 'number') {
        expect(TrezorConnect.blockchainEstimateFee).toHaveBeenCalledTimes(result.estimateFeeCalls);
    }
    if (typeof result.getAccountInfoCalls === 'number') {
        expect(TrezorConnect.getAccountInfo).toHaveBeenCalledTimes(result.getAccountInfoCalls);
    }

    // validate '@trezor/connect' params
    if (result.composeTransactionParams) {
        const composeTransactionCallsLength = TrezorConnect.composeTransaction.mock.calls.length;
        const composeTransactionsParams =
            TrezorConnect.composeTransaction.mock.calls[composeTransactionCallsLength - 1][0];

        if (result.composeTransactionParams.account) {
            expect(composeTransactionsParams.account.utxo.length).toEqual(
                result.composeTransactionParams.account.utxo.length,
            );
            expect(composeTransactionsParams.account.utxo).toMatchObject(
                result.composeTransactionParams.account.utxo,
            );
        } else {
            expect(composeTransactionsParams).toMatchObject(result.composeTransactionParams);
        }
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

    const {
        composedLevels,
        getValues,
        formState: { errors },
    } = getContextValues();

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
            // @ts-expect-error key: string
            const error = errors[key];
            if (expectedError) {
                expect(error).toMatchObject(expectedError);
            } else {
                expect(error).toBe(undefined);
            }
        });
    }
};

const waitForOutputsRender = (timeout = 200) =>
    waitFor(() => findByTestId(/outputs\.[0-9]+\.address/), { timeout });

describe('useSendForm hook', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    fixtures.addingOutputs.forEach(f => {
        it(
            f.description,
            async () => {
                const store = initStore(f.store);
                const callback: TestCallback = {};
                const { unmount } = await act(() =>
                    renderWithProviders(
                        store,
                        <SendIndex>
                            <Component callback={callback} />
                        </SendIndex>,
                    ),
                );
                // wait for first render
                await waitForLoader();
                const renderedOutputs = await waitForOutputsRender();

                if (!callback.getContextValues) throw Error('callback.getContextValues missing');

                // check HTML elements after first render
                expect(renderedOutputs.length).toBe(f.initial.outputs.length);
                expect(callback.getContextValues().getValues()).toMatchObject(f.initial);

                await actionSequence(f.actions, a => {
                    // check rendered HTML elements (Output.address input)
                    expect(findByTestId(/outputs\.[0-9]+\.address/).length).toBe(
                        a.result.formValues.outputs.length,
                    );
                    // validate action result
                    actionCallback(callback, a);
                });
                unmount();
            },
            TEST_TIMEOUT,
        );
    });

    fixtures.setMax.forEach(f => {
        it(
            f.description,
            async () => {
                testMocks.setTrezorConnectFixtures(f.connect);
                const store = initStore(f.store);
                const callback: TestCallback = {};
                const { unmount } = renderWithProviders(
                    store,
                    <SendIndex>
                        <Component callback={callback} />
                    </SendIndex>,
                );
                // wait for first render
                await waitForLoader();
                await waitForOutputsRender();
                // execute user actions sequence
                if (f.actions) {
                    await actionSequence(f.actions, a => actionCallback(callback, a));
                }

                // validate finalResult
                actionCallback(callback, { result: f.finalResult });

                unmount();
            },
            TEST_TIMEOUT,
        );
    });

    fixtures.composeDebouncedTransaction.forEach(f => {
        it(
            f.description,
            async () => {
                testMocks.setTrezorConnectFixtures(f.connect);
                const store = initStore();
                const callback: TestCallback = {};
                const { unmount } = renderWithProviders(
                    store,
                    <SendIndex>
                        <Component callback={callback} />
                    </SendIndex>,
                );
                await waitFor(() => findByTestId(/outputs\.[0-9]+\.address/));
                // execute user actions sequence
                if (f.actions) {
                    await actionSequence(f.actions, a => actionCallback(callback, a));
                }

                // validate finalResult
                actionCallback(callback, { result: f.finalResult });

                unmount();
            },
            TEST_TIMEOUT,
        );
    });

    fixtures.signAndPush.forEach(f => {
        it(
            f.description,
            async () => {
                testMocks.setTrezorConnectFixtures(f.connect);
                const store = initStore(f.store);
                const callback: TestCallback = {};
                const { unmount } = await act(() =>
                    renderWithProviders(
                        store,
                        <SendIndex>
                            <Component callback={callback} />
                        </SendIndex>,
                    ),
                );

                // wait for first render
                await waitForLoader();
                store.subscribe(() => {
                    const actions = filterThunkActionTypes(store.getActions());
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
            },
            TEST_TIMEOUT,
        );
    });

    fixtures.feeChange.forEach(f => {
        it(
            `changeFee: ${f.description}`,
            async () => {
                testMocks.setTrezorConnectFixtures(f.connect);
                const store = initStore(f.store);
                const callback: TestCallback = {};
                const { unmount } = renderWithProviders(
                    store,
                    <SendIndex>
                        <Component callback={callback} />
                    </SendIndex>,
                );

                // wait for first render
                await waitForLoader();
                await waitForOutputsRender();

                // execute user actions sequence
                await actionSequence(f.actionSequence, a => actionCallback(callback, a));

                // validate finalResult
                actionCallback(callback, { result: f.finalResult });

                unmount();
            },
            TEST_TIMEOUT,
        );
    });

    fixtures.amountUnitChange.forEach(f => {
        it(
            f.description,
            async () => {
                testMocks.setTrezorConnectFixtures(f.connect);
                const store = initStore(f.store);
                const callback: TestCallback = {};
                const { unmount } = renderWithProviders(
                    store,
                    <SendIndex>
                        <Component callback={callback} />
                    </SendIndex>,
                );

                // wait for first render
                await waitForLoader();
                await waitForOutputsRender();

                // execute user actions sequence
                await actionSequence(f.actions, a => actionCallback(callback, a));

                // validate finalResult
                actionCallback(callback, { result: f.finalResult });

                unmount();
            },
            TEST_TIMEOUT,
        );
    });
});
