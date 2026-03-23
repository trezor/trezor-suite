import '@suite-common/test-utils/src/globalOverrides';

import { screen } from '@testing-library/react';

import { configureMockStore, initPreloadedState } from '@suite-common/test-utils';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { type ServerInfo } from '@trezor/blockchain-link-types';
import TrezorConnect from '@trezor/connect';

import { ChangeFee } from 'src/components/suite/modals/ReduxModal/UserContextModal/TxDetailModal/ChangeFee/ChangeFee';
import { ReplaceTxButton } from 'src/components/suite/modals/ReduxModal/UserContextModal/TxDetailModal/ChangeFee/ReplaceTxButton';
import {
    actionSequence,
    findByTestId,
    renderWithProviders,
    waitForLoader,
} from 'src/support/tests/hooksHelper';

import { extraDependenciesDesktopMock } from '../../../support/tests/extraDependenciesDesktop.mock';
import * as fixtures from '../__fixtures__/useRbfForm';
import { RbfContext, useRbf, useRbfContext } from '../useRbfForm';

global.ResizeObserver = class MockedResizeObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
};

// do not mock
jest.unmock('@trezor/connect');

jest.mock('@suite/router', () => ({
    ...jest.requireActual('@suite/router'),
    goto: () => ({ type: 'mock-redirect' }),
}));

// !!! Must be a stable reference, else it will break some hooks / memoization and causes inf. re-renders
const translationStringMock = (id: string) => id;

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id }: any) => id,
    useTranslation: () => ({ translationString: translationStringMock }),
}));

// since we are NOT(!) mocking @trezor/connect it fetch real bridge at init
jest.mock('cross-fetch', () => ({
    __esModule: true,
    default: () => Promise.resolve({ ok: false }),
}));

jest.mock('@suite-common/tx-simulation', () => ({}));

// TrezorConnect.composeTransaction is trying to connect to blockchain, to get current block height.
// Mock whole module to avoid internet connection.
jest.mock('@trezor/blockchain-link', () => {
    class BlockchainLink {
        name = 'jest-mocked-module';
        listeners: Record<string, () => void> = {};

        constructor(args: any) {
            this.name = args.name;
        }

        on(...args: any[]) {
            const [type, fn] = args;
            this.listeners[type] = fn;
        }

        listenerCount() {
            return 0;
        }

        connect() {
            return true;
        }

        disconnect() {
            return Promise.resolve(true);
        }

        removeAllListeners() {}

        dispose() {}
        getInfo(): ServerInfo {
            return {
                url: this.name,
                name: this.name,
                shortcut: this.name,
                network: this.name,
                version: '0.0.0',
                decimals: 0,
                blockHeight: 10000000,
                blockHash: 'abcd',
                testnet: false,
            };
        }

        estimateFee(params: { blocks: number[] }) {
            return params.blocks.map(() => ({ feePerUnit: '-1' }));
        }
    }

    return {
        __esModule: true,
        BlockchainLink,
    };
});

type RootReducerState = ReturnType<ReturnType<typeof fixtures.getRootReducer>>;

interface Args {
    send?: Partial<RootReducerState['wallet']['send']>;
    fees?: any;
    selectedAccount?: any;
    coinjoin?: any;
}

const initStore = ({ send, fees, selectedAccount, coinjoin }: Args = {}) => {
    const rootReducer = fixtures.getRootReducer(selectedAccount, fees);

    return configureMockStore({
        reducer: rootReducer,
        preloadedState: initPreloadedState({
            rootReducer,
            partialState: {
                wallet: { send, coinjoin },
            },
        }),
    });
};

interface TestCallback {
    getContextValues?: () => any;
}

// component rendered inside of SendIndex
// callback prop is an object passed from single test case
// getContextValues returns actual state of SendFormContext
const Component = ({ callback }: { callback: TestCallback }) => {
    const values = useRbfContext();
    // eslint-disable-next-line react-hooks/immutability
    callback.getContextValues = () => values;

    return values.isLoading ? <div>Loading</div> : null;
};

describe('useRbfForm hook', () => {
    beforeAll(async () => {
        await TrezorConnect.init({
            transportReconnect: false,
            pendingTransportEvent: false,
            manifest: {
                email: 'info@trezor.io',
                appName: 'Trezor Connect Tests',
                appUrl: '@trezor/suite',
            },
        });
        jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
    });
    afterAll(() => {
        TrezorConnect.dispose();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    fixtures.composeAndSign.forEach(f => {
        it(`composeAndSign: ${f.description}`, async () => {
            const store = initStore(f.store);
            const callback: TestCallback = {};

            const TestComponent = () => {
                const contextValues = useRbf({
                    rbfParams: f.tx.rbfParams,
                    chainedTxs: f.chainedTxs,
                    selectedAccount: f.store.selectedAccount as SelectedAccountLoaded,
                });

                return (
                    <RbfContext.Provider value={contextValues}>
                        <ChangeFee tx={f.tx} chainedTxs={f.chainedTxs} showChained={() => {}}>
                            <Component callback={callback} />
                            <ReplaceTxButton />
                        </ChangeFee>
                    </RbfContext.Provider>
                );
            };

            const { unmount } = renderWithProviders(
                store,
                extraDependenciesDesktopMock.services,
                <TestComponent />,
            );

            const composeTransactionSpy = jest.spyOn(TrezorConnect, 'composeTransaction');

            // mock responses from 'signTransaction'.
            // response doesn't matter. parameters are tested.
            const signTransactionMock = jest
                .spyOn(TrezorConnect, 'signTransaction')
                .mockImplementation(() =>
                    Promise.resolve({
                        success: false,
                        error: { message: 'error', code: 'Failure_UnknownCode' },
                    }),
                );

            // wait for first render
            await waitForLoader();

            if (!callback.getContextValues) throw Error('callback.getContextValues missing');

            const { composedLevels } = callback.getContextValues();
            // check composeTransaction result
            expect(composedLevels).toMatchObject(f.composedLevels);

            // validate number of calls to '@trezor/connect'
            expect(composeTransactionSpy).toHaveBeenCalledTimes(f.composeTransactionCalls);

            if (f.decreasedOutputs !== undefined) {
                if (typeof f.decreasedOutputs === 'string') {
                    expect(() => screen.getByText(f.decreasedOutputs as string)).not.toThrow();
                } else {
                    expect(() => findByTestId('@send/decreased-outputs')).not.toThrow();
                }
            } else {
                expect(() => findByTestId('@send/decreased-outputs')).toThrow(
                    'Unable to find an element',
                );
            }

            const sendAction = () =>
                actionSequence([
                    {
                        type: 'click',
                        element: '@send/replace-tx-button',
                    },
                ]);

            if (f.signedTx) {
                // send and check signTransaction params
                await sendAction();
                expect(signTransactionMock).toHaveBeenCalledTimes(1);
                const params = signTransactionMock.mock.calls[0][0];
                expect(params).toMatchObject(f.signedTx);
            } else {
                await expect(sendAction()).rejects.toThrow('Unable to perform pointer interaction'); // button `pointer-events: none`
                expect(signTransactionMock).toHaveBeenCalledTimes(0);
            }

            unmount();
        });
    });
});
