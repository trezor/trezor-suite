import TrezorConnect from '@trezor/connect';
import React from 'react';
import { configureStore } from '@suite/support/tests/configureStore';
import * as fixtures from '../__fixtures__/useRbfForm';
import sendFormReducer from '@wallet-reducers/sendFormReducer';
import resizeReducer from '@suite-reducers/resizeReducer';

import {
    renderWithProviders,
    waitForLoader,
    waitForRender,
    actionSequence,
} from '@suite/support/tests/hooksHelper';
import { ChangeFee } from '@suite-components/modals/TransactionDetail/components/ChangeFee';
import { useRbfContext } from '../useRbfForm';

jest.mock('@suite-actions/routerActions', () => ({
    goto: () => ({ type: 'mock-redirect' }),
}));

jest.mock('react-svg', () => ({ ReactSVG: () => 'SVG' }));

// TrezorConnect.composeTransaction is trying to connect to blockchain, to get current block height.
// Mock whole module to avoid internet connection.
jest.mock('@trezor/blockchain-link', () => ({
    __esModule: true,
    default: class BlockchainLink {
        name = 'jest-mocked-module';
        constructor(args: any) {
            this.name = args.name;
        }

        on() {}

        connect() {}

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
    },
}));

export const getInitialState = ({ send, fees, selectedAccount }: any = {}) => ({
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
});

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>();

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
    getContextValues?: () => any;
}
// component rendered inside of SendIndex
// callback prop is an object passed from single test case
// getContextValues returns actual state of SendFormContext
const Component = ({ callback }: { callback: TestCallback }) => {
    const values = useRbfContext();
    callback.getContextValues = () => values;
    const [loading, setLoading] = React.useState(false);
    React.useEffect(() => {
        setLoading(values.isLoading);
    }, [loading, values.isLoading]);

    return loading ? <div>Loading</div> : null;
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
    });
    afterAll(async () => {
        await TrezorConnect.dispose();
    });
    beforeEach(() => {
        jest.setTimeout(30000); // action sequences takes time
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    fixtures.composeAndSign.forEach(f => {
        it(`composeAndSign: ${f.description}`, async () => {
            const store = initStore(getInitialState(f.store));
            const callback: TestCallback = {};
            const { unmount } = renderWithProviders(
                store,
                // @ts-expect-error f.tx is not exact
                <ChangeFee tx={f.tx} finalize={false} chainedTxs={[]} showChained={() => {}}>
                    <Component callback={callback} />
                </ChangeFee>,
            );

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

            if (f.expectRerender) {
                await waitForRender();

                // wait for possible second render (decrease, set-max calculation)
                await waitForLoader();
            }

            const { composedLevels } = callback.getContextValues();

            // check composeTransaction result
            expect(composedLevels).toMatchObject(f.composedLevels);

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
                expect(signTransactionMock).toBeCalledTimes(1);
                const params = signTransactionMock.mock.calls[0][0];
                expect(params).toMatchObject(f.signedTx);
            } else {
                await expect(sendAction()).rejects.toThrow('Unable to perform pointer interaction'); // button `pointer-events: none`
                expect(signTransactionMock).toBeCalledTimes(0);
            }

            unmount();
        });
    });
});
