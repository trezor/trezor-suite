import TrezorConnect from 'trezor-connect';
import React from 'react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as fixtures from '../__fixtures__/useRbfForm';
import sendFormReducer from '@wallet-reducers/sendFormReducer';
import resizeReducer from '@suite-reducers/resizeReducer';

import {
    renderWithProviders,
    waitForLoader,
    actionSequence,
} from '@suite/support/tests/hooksHelper';
import ChangeFee from '@suite-components/modals/TransactionDetail/components/ChangeFee';
import { useRbfContext } from '../useRbfForm';

jest.mock('@suite-actions/routerActions', () => ({
    goto: () => ({ type: 'mock-redirect' }),
}));

jest.mock('react-svg', () => ({ ReactSVG: () => 'SVG' }));

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
            webusb: false,
            transportReconnect: false,
            pendingTransportEvent: false,
            manifest: {
                email: 'info@trezor.io',
                appUrl: '@trezor/suite',
            },
        });
    });
    afterAll(() => {
        TrezorConnect.dispose();
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
                // @ts-ignore f.tx is not exact
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

            // wait for possible second render (decrease, set-max calculation)
            await waitForLoader();

            const { composedLevels } = callback.getContextValues();

            // check composeTransaction result
            expect(composedLevels).toMatchObject(f.composedLevels);

            // send
            await actionSequence([
                {
                    type: 'click',
                    element: '@send/replace-tx-button',
                },
            ]);

            // check signTransaction params
            if (f.signedTx) {
                expect(signTransactionMock).toBeCalledTimes(1);
                const params = signTransactionMock.mock.calls[0][0];
                expect(params).toMatchObject(f.signedTx);
            } else {
                expect(signTransactionMock).toBeCalledTimes(0);
            }

            unmount();
        });
    });
});
