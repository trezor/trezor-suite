import TrezorConnect from '@trezor/connect';
import { screen } from '@testing-library/react';
import { configureMockStore, initPreloadedState } from '@suite-common/test-utils';
import * as fixtures from '../__fixtures__/useRbfForm';
import {
    renderWithProviders,
    waitForLoader,
    actionSequence,
    findByTestId,
} from 'src/support/tests/hooksHelper';
import { ChangeFee } from 'src/components/suite/modals/ReduxModal/UserContextModal/TxDetailModal/ChangeFee/ChangeFee';
import { useRbfContext } from '../useRbfForm';

// do not mock
jest.unmock('@trezor/connect');

jest.mock('src/actions/suite/routerActions', () => ({
    goto: () => ({ type: 'mock-redirect' }),
}));

// render only Translation['id']
jest.mock('src/components/suite/Translation', () => ({ Translation: ({ id }: any) => id }));

// since we are NOT(!) mocking @trezor/connect it fetch real bridge at init
jest.mock('cross-fetch', () => ({
    __esModule: true,
    default: () => Promise.resolve({ ok: false }),
}));

// TrezorConnect.composeTransaction is trying to connect to blockchain, to get current block height.
// Mock whole module to avoid internet connection.
jest.mock('@trezor/blockchain-link', () => ({
    __esModule: true,
    default: class BlockchainLink {
        name = 'jest-mocked-module';
        listeners: Record<string, () => void> = {};
        constructor(args: any) {
            this.name = args.name;
        }
        on(...args: any[]) {
            const [type, fn] = args;
            this.listeners[type] = fn;
        }
        connect() {
            this.listeners.connected();
        }
        disconnect() {}
        removeAllListeners() {}
        dispose() {}
        getInfo() {
            return {
                url: this,
                name: this.name,
                shortcut: this.name,
                version: '0.0.0',
                decimals: 0,
                blockHeight: 10000000,
                blockHash: 'abcd',
            };
        }
        estimateFee(params: { blocks: number[] }) {
            return params.blocks.map(() => ({ feePerUnit: '-1' }));
        }
    },
}));

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
                appUrl: '@trezor/suite',
            },
        });
        jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
    });
    afterAll(async () => {
        await TrezorConnect.dispose();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    fixtures.composeAndSign.forEach(f => {
        it(`composeAndSign: ${f.description}`, async () => {
            const store = initStore(f.store);
            const callback: TestCallback = {};
            const { unmount } = renderWithProviders(
                store,
                // @ts-expect-error f.tx is not exact
                <ChangeFee tx={f.tx} chainedTxs={f.chainedTxs} showChained={() => {}}>
                    <Component callback={callback} />
                </ChangeFee>,
            );

            const composeTransactionSpy = jest.spyOn(TrezorConnect, 'composeTransaction');

            // mock responses from 'signTransaction'.
            // response doesn't matter. parameters are tested.
            const signTransactionMock = jest
                .spyOn(TrezorConnect, 'signTransaction')
                .mockImplementation(() =>
                    Promise.resolve({
                        success: false,
                        payload: { error: 'error' },
                    }),
                );

            // wait for first render
            await waitForLoader();

            if (!callback.getContextValues) throw Error('callback.getContextValues missing');

            const { composedLevels } = callback.getContextValues();

            // check composeTransaction result
            expect(composedLevels).toMatchObject(f.composedLevels);

            // validate number of calls to '@trezor/connect'
            if (typeof f.composeTransactionCalls === 'number') {
                expect(composeTransactionSpy).toHaveBeenCalledTimes(f.composeTransactionCalls);
            }

            if (f.decreasedOutputs) {
                if (typeof f.decreasedOutputs === 'string') {
                    expect(() => screen.getByText(f.decreasedOutputs)).not.toThrow();
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
