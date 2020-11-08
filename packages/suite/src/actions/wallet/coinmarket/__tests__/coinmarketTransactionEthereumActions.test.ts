/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import coinmarketReducer from '@wallet-reducers/coinmarketReducer';
import * as coinmarketTransactionEthereumActions from '../coinmarketTransactionEthereumActions';
import { ETH_SIGN_TRANSACTION_FIXTURES } from '../__fixtures__/coinmarketCommonActions/signTransaction';
import { DEFAULT_STORE } from '../__fixtures__/coinmarketCommonActions/store';
import selectedAccountReducer from '@wallet-reducers/selectedAccountReducer';
import transactionReducer from '@wallet-reducers/transactionReducer';

export const getInitialState = (initial = {}) => {
    return {
        ...DEFAULT_STORE,
        ...initial,
    };
};

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
            ethereumSignTransaction: jest.fn(async _params => {
                return getNextFixture();
            }),
            blockchainEstimateFee: () => {
                return getNextFixture();
            },
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

describe('Coinmarket Transaction Ethereum Actions', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    ETH_SIGN_TRANSACTION_FIXTURES.forEach(f => {
        it(f.description, async () => {
            const store = initStore(getInitialState(f.initialState));
            require('trezor-connect').setTestFixtures(f.connect);

            const result = await store.dispatch(
                coinmarketTransactionEthereumActions.signTransaction(f.params.data),
            );
            expect(result).toMatchSnapshot();
        });
    });
});
