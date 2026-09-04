import '@suite-common/test-utils/globalOverrides';

import { useEffect, useState } from 'react';
import { type DeepPartial } from 'react-hook-form';

import { waitFor } from '@testing-library/react';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { debugInitialState } from '@suite/debug';
import { closeModal, openModal } from '@suite/modal';
import { suiteSettingsInitialState } from '@suite/settings';
import { type AddressValidatorDep, type GetNamedAddressSupportDep } from '@suite-common/address';
import { mockAddressValidator, mockGetNamedAddressSupport } from '@suite-common/address/mocks';
import {
    type FindNetworkSymbolForProtocolDep,
    type NetworkModuleRepositoryDep,
} from '@suite-common/networks';
import {
    mockFindNetworkSymbolForProtocol,
    mockNetworkModule,
    mockNetworkModuleRepository,
} from '@suite-common/networks/mocks';
import { type MigrateSuiteSyncLabelsForRbfTransactionDep } from '@suite-common/suite-rbf-labels-migrations-types';
import { mockMigrateSuiteSyncLabelsForRbfTransaction } from '@suite-common/suite-rbf-labels-migrations-types/mocks';
import { mockSuiteSync } from '@suite-common/suite-sync/mocks';
import { type SuiteSyncDep } from '@suite-common/suite-sync-types';
import { type GetIsWindowVisibleDep, type OnModalCancelDep } from '@suite-common/suite-types';
import { mockGetIsWindowVisible } from '@suite-common/suite-types/mocks';
import {
    createTestCompositionRoot,
    filterThunkActionTypes,
    initPreloadedState,
    testMocks,
} from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type FormState, type GetTradedAccountKeysDep } from '@suite-common/wallet-types';
import { mockGetTradedAccountKeys } from '@suite-common/wallet-types/mocks';
import { type PROTO } from '@trezor/connect';
import { asProtocol } from '@trezor/network-module-suite-common-types';

import {
    type UserAction,
    actionSequence,
    findByTestId,
    renderHookWithProviders,
    renderWithProviders,
    waitForLoader,
} from 'src/support/test-utils/hooksHelper';
import { type SendContextValues } from 'src/types/wallet/sendForm';
import SendIndex from 'src/views/wallet/send';

import * as fixtures from './__fixtures__/useSendForm';
import { useSendForm, useSendFormContext } from './useSendForm';

const TEST_TIMEOUT = 35000;

global.ResizeObserver = class MockedResizeObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
};

// used by `framer-motion` module
global.scrollTo = jest.fn();

// sendFormActions.signTransaction fetch ethereum definitions
jest.mock('cross-fetch', () => ({
    __esModule: true,
    default: () => Promise.resolve({ ok: false }),
}));

jest.mock('@suite/router', () => ({
    ...jest.requireActual('@suite/router'),
    gotoThunk: () => ({ type: 'mock-redirect' }),
}));

// !!! Must be a stable reference, else it will break some hooks / memoization and causes inf. re-renders
const translationStringMock = (id: string) => id;

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id }: any) => id,
    useTranslation: () => ({ translationString: translationStringMock }),
}));

jest.mock('@suite-common/tx-simulation', () => ({}));

type RootReducerState = ReturnType<ReturnType<typeof fixtures.getRootReducer>>;
interface Args {
    send?: Partial<RootReducerState['wallet']['send']>;
    fees?: any;
    selectedAccount?: any;
    coinjoin?: any;
    bitcoinAmountUnit?: PROTO.AmountUnit;
    protocol?: Partial<RootReducerState['protocol']>;
}

const TrezorConnect = testMocks.getTrezorConnectMock();
type SendFormTestServices = AddressValidatorDep &
    DesktopAnalyticsDep &
    FindNetworkSymbolForProtocolDep &
    GetIsWindowVisibleDep &
    GetNamedAddressSupportDep &
    GetTradedAccountKeysDep &
    MigrateSuiteSyncLabelsForRbfTransactionDep &
    NetworkModuleRepositoryDep &
    SuiteSyncDep;

const services: SendFormTestServices = {
    addressValidator: mockAddressValidator({
        isAddressValid: address => address !== '' && address !== 'X' && address !== 'FOO',
    }),
    analytics: mockDesktopAnalytics(),
    findNetworkSymbolForProtocol: mockFindNetworkSymbolForProtocol({
        [asProtocol('bitcoin')]: asNetworkSymbol('btc'),
    }),
    getIsWindowVisible: mockGetIsWindowVisible(),
    getNamedAddressSupport: mockGetNamedAddressSupport(),
    getTradedAccountKeys: mockGetTradedAccountKeys(),
    migrateSuiteSyncLabelsForRbfTransaction: mockMigrateSuiteSyncLabelsForRbfTransaction(),
    networkModuleRepository: mockNetworkModuleRepository({ get: () => mockNetworkModule() }),
    suiteSync: mockSuiteSync(),
};
const extraActions: OnModalCancelDep = { onModalCancel: closeModal };

const buildTestCompositionRootParams = ({
    send,
    fees,
    selectedAccount,
    coinjoin,
    bitcoinAmountUnit,
    protocol,
}: Args = {}) => {
    const rootReducer = fixtures.getRootReducer(selectedAccount, fees);

    const preloadedState = initPreloadedState({
        rootReducer,
        partialState: {
            wallet: {
                send,
                coinjoin,
                settings: { bitcoinAmountUnit, enabledNetworks: ['thod'] },
            },
            suiteSettings: { ...suiteSettingsInitialState, language: 'en' },
            debug: debugInitialState,
            router: { route: { name: 'wallet-send' } },
            ...(protocol ? { protocol } : {}),
        },
    });

    return {
        extra: { actions: extraActions, services },
        reducer: rootReducer,
        preloadedState,
        // NOTE: this action contains `decision` callback which is not serializable
        serializableCheck: { ignoredActions: ['@modal/open-user-context'] },
    };
};

interface TestCallback {
    getContextValues?: () => SendContextValues;
}
// component rendered inside of SendIndex
// callback prop is an object passed from single test case
// getContextValues returns actual state of SendFormContext
const Component = ({ callback }: { callback: TestCallback }) => {
    const values = useSendFormContext();
    // eslint-disable-next-line react-hooks/immutability
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
    solanaComposeTransactionCalls?: number;
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
    if (typeof result.solanaComposeTransactionCalls === 'number') {
        expect(TrezorConnect.solanaComposeTransaction).toHaveBeenCalledTimes(
            result.solanaComposeTransactionCalls,
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
            TrezorConnect.composeTransaction.mock.calls[composeTransactionCallsLength - 1]?.[0];

        if (result.composeTransactionParams.account && composeTransactionsParams) {
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
    waitFor(() => findByTestId(/^outputs\.[0-9]+\.address$/), { timeout });

describe('useSendForm hook', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it(
        'fills label from protocol uri into send output',
        async () => {
            const protocolAddress = '1BoatSLRHtKNngkdXEeobR76b53LETtpyT';
            const protocolAmount = '0.1';
            const protocolLabel = 'Trezor donation';
            const root = createTestCompositionRoot(
                buildTestCompositionRootParams({
                    protocol: {
                        sendForm: {
                            shouldFill: true,
                            scheme: 'bitcoin',
                            address: protocolAddress,
                            amount: protocolAmount,
                            label: protocolLabel,
                        },
                    },
                }),
            );
            const state = root.store.getState();
            const { result, unmount } = renderHookWithProviders(root, () =>
                useSendForm({
                    selectedAccount: state.wallet.selectedAccount,
                    localCurrency: 'usd',
                    fees: state.wallet.fees,
                    online: true,
                    metadataEnabled: false,
                }),
            );

            await waitFor(() => {
                expect(result.current.getValues()).toMatchObject({
                    outputs: [
                        {
                            address: protocolAddress,
                            amount: protocolAmount,
                            label: protocolLabel,
                        },
                    ],
                });
            });

            unmount();
        },
        TEST_TIMEOUT,
    );

    fixtures.addingOutputs.forEach(f => {
        it(
            f.description,
            async () => {
                const root = createTestCompositionRoot(buildTestCompositionRootParams(f.store));
                const callback: TestCallback = {};
                const { unmount } = renderWithProviders(
                    root,
                    <SendIndex>
                        <Component callback={callback} />
                    </SendIndex>,
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
                    expect(findByTestId(/^outputs\.[0-9]+\.address$/).length).toBe(
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
        // Add conditional test execution
        if (f.skip) return;

        it(
            f.description,
            async () => {
                testMocks.setTrezorConnectFixtures(f.connect);
                const root = createTestCompositionRoot(buildTestCompositionRootParams(f.store));
                const callback: TestCallback = {};
                const { unmount } = renderWithProviders(
                    root,
                    <SendIndex>
                        <Component callback={callback} />
                    </SendIndex>,
                );
                console.log('renderWithProviders');
                // wait for first render
                await waitForLoader();
                console.log('waitForLoader');
                console.log('waitForOutputsRender');
                const renderedOutputs = await waitForOutputsRender();

                console.log('waitForOutputsRender', renderedOutputs);
                // execute user actions sequence
                if (f.actions) {
                    console.log('actionSequence');
                    await actionSequence(f.actions, a => actionCallback(callback, a));
                }

                console.log('actionCallback');
                // validate finalResult
                actionCallback(callback, { result: f.finalResult });

                console.log('unmount');
                unmount();
            },
            TEST_TIMEOUT,
        );
    });

    fixtures.composeDebouncedTransaction.forEach(f => {
        // Add conditional test execution
        const testFn = f.skip ? it.skip : it;
        testFn(
            f.description,
            async () => {
                testMocks.setTrezorConnectFixtures(f.connect);
                const root = createTestCompositionRoot(buildTestCompositionRootParams());
                const callback: TestCallback = {};
                const { unmount } = renderWithProviders(
                    root,
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
                const root = createTestCompositionRoot(buildTestCompositionRootParams(f.store));
                const callback: TestCallback = {};
                const { unmount } = renderWithProviders(
                    root,
                    <SendIndex>
                        <Component callback={callback} />
                    </SendIndex>,
                );

                // wait for first render
                await waitForLoader();
                root.store.subscribe(() => {
                    const actions = filterThunkActionTypes(root.services.getActions());
                    const lastAction = actions[actions.length - 1];
                    if (
                        openModal.match(lastAction) &&
                        lastAction.payload.type === 'review-transaction' &&
                        'decision' in lastAction.payload &&
                        lastAction.payload.decision
                    ) {
                        lastAction.payload.decision.resolve(true); // always resolve push tx request
                    }
                });

                await actionSequence([{ type: 'click', element: '@send/review-button' }], () => {
                    const actions = root.services.getActions();
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
        // Add conditional test execution
        const testFn = f.skip ? it.skip : it;
        testFn(
            `changeFee: ${f.description}`,
            async () => {
                testMocks.setTrezorConnectFixtures(f.connect);

                const root = createTestCompositionRoot(
                    buildTestCompositionRootParams(f.store as Args),
                );
                const callback: TestCallback = {};
                const { unmount } = renderWithProviders(
                    root,
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
                const root = createTestCompositionRoot(buildTestCompositionRootParams(f.store));
                const callback: TestCallback = {};

                const { unmount } = renderWithProviders(
                    root,
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
