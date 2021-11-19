import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import coinmarketReducer, { ComposedTransactionInfo } from '@wallet-reducers/coinmarketReducer';
import selectedAccountReducer from '@wallet-reducers/selectedAccountReducer';
import * as coinmarketCommonActions from '../coinmarketCommonActions';
import { DEFAULT_STORE } from '../__fixtures__/coinmarketCommonActions/store';
import { VERIFY_ADDRESS_FIXTURES } from '../__fixtures__/coinmarketCommonActions/verifyAddress';
import transactionReducer from '@wallet-reducers/transactionReducer';

export const getInitialState = (initial = {}) => ({
    ...DEFAULT_STORE,
    ...initial,
});
type State = ReturnType<typeof getInitialState>;

const mockStore = configureStore<State, any>([thunk]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { coinmarket, selectedAccount, transactions } = store.getState().wallet;
        store.getState().wallet = {
            coinmarket: coinmarketReducer(coinmarket, action),
            selectedAccount: selectedAccountReducer({ ...selectedAccount }, action),
            transactions: transactionReducer(transactions, action),
        };
        store.getActions().push(action);
    });
    return store;
};

jest.mock('trezor-connect', () => {
    let fixture: any;
    let buttonRequest: ((e?: any) => any) | undefined;
    let fixtureIndex = 0;

    const getAddress = (_params: any) => {
        if (fixture && fixture.getAddress) {
            if (fixture.getAddress.success && buttonRequest) {
                buttonRequest({ code: 'ButtonRequest_Address' });
            }
            return fixture.getAddress;
        }
        // trigger multiple button requests
        if (buttonRequest) {
            buttonRequest({ code: 'ButtonRequest_Address' });
            buttonRequest({ code: 'some-other-code' });
            buttonRequest();
        }
        return {
            success: true,
            payload: {
                address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX',
            },
        };
    };
    const getNextFixture = () => {
        if (!fixture) return { success: false, payload: { error: 'error' } };
        const f = Array.isArray(fixture) ? fixture[fixtureIndex] : fixture;
        fixtureIndex++;
        if (!f) return { success: false, payload: { error: 'error' } };
        return f.response;
    };
    return {
        __esModule: true, // this property makes it work
        default: {
            blockchainSetCustomBackend: () => {},
            init: () => null,
            on: (event: string, cb: (e?: any) => any) => {
                if (event === 'ui-button') buttonRequest = cb;
            },
            off: () => {
                buttonRequest = undefined;
            },
            getAddress,
            ethereumGetAddress: getAddress,
            rippleGetAddress: getAddress,
            // eslint-disable-next-line require-await
            composeTransaction: jest.fn(async _params => getNextFixture()),
            blockchainEstimateFee: () => getNextFixture(),
        },
        setTestFixtures: (f: any) => {
            fixture = f;
            fixtureIndex = 0;
        },
        DEVICE_EVENT: 'DEVICE_EVENT',
        UI_EVENT: 'UI_EVENT',
        TRANSPORT_EVENT: 'TRANSPORT_EVENT',
        BLOCKCHAIN_EVENT: 'BLOCKCHAIN_EVENT',
        DEVICE: {},
        TRANSPORT: {},
        BLOCKCHAIN: {},
        UI: {
            REQUEST_BUTTON: 'ui-button',
        },
    };
});

describe('Coinmarket Common Actions', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    VERIFY_ADDRESS_FIXTURES.forEach(f => {
        it(f.description, async () => {
            const store = initStore(getInitialState(f.initialState));

            await store.dispatch(
                coinmarketCommonActions.verifyAddress(f.params.account, f.params.inExchange),
            );
            expect(
                f.params.inExchange
                    ? store.getState().wallet.coinmarket.exchange.addressVerified
                    : store.getState().wallet.coinmarket.buy.addressVerified,
            ).toEqual(f.result.value);
            if (f.result && f.result.actions) {
                expect(store.getActions()).toMatchObject(f.result.actions);
            }
        });
    });

    it('saveComposedTransaction', () => {
        const store = initStore(getInitialState());

        const info: ComposedTransactionInfo = {
            selectedFee: 'normal',
            composed: {
                fee: '43214234',
                feePerByte: '13',
            },
        };

        store.dispatch(coinmarketCommonActions.saveComposedTransactionInfo(info));
        expect(store.getState().wallet.coinmarket.composedTransactionInfo).toEqual(info);
    });
});
