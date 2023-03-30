import { MODAL } from '@suite-actions/constants';
import { BTC_ACCOUNT, ETH_ACCOUNT, XRP_ACCOUNT } from './accounts';
import { COINMARKET_BUY, COINMARKET_EXCHANGE } from '@wallet-actions/constants';

const { getSuiteDevice } = global.JestMocks;
const UNAVAILABLE_DEVICE = getSuiteDevice({ available: false });
const AVAILABLE_DEVICE = getSuiteDevice({ available: true, connected: true });

export const VERIFY_BUY_ADDRESS_FIXTURES = [
    {
        description: 'verifyAddress, bitcoin account',
        initialState: {
            suite: {
                device: AVAILABLE_DEVICE,
            },
        },
        params: {
            account: BTC_ACCOUNT,
            address: BTC_ACCOUNT.addresses?.unused[0].address,
            path: BTC_ACCOUNT.addresses?.unused[0].path,
            coinmarketAction: COINMARKET_BUY.VERIFY_ADDRESS as typeof COINMARKET_BUY.VERIFY_ADDRESS,
        },
        result: {
            value: BTC_ACCOUNT.addresses?.unused[0].address,
            actions: [
                {
                    type: COINMARKET_BUY.VERIFY_ADDRESS,
                    addressVerified: BTC_ACCOUNT.addresses?.unused[0].address,
                },
            ],
        },
    },
    {
        description: 'verifyAddress, ethereum account',
        initialState: {
            suite: {
                device: AVAILABLE_DEVICE,
            },
        },
        params: {
            account: ETH_ACCOUNT,
            address: ETH_ACCOUNT.descriptor,
            path: ETH_ACCOUNT.path,
            coinmarketAction: COINMARKET_BUY.VERIFY_ADDRESS as typeof COINMARKET_BUY.VERIFY_ADDRESS,
        },
        result: {
            value: ETH_ACCOUNT.descriptor,
            actions: [
                {
                    type: COINMARKET_BUY.VERIFY_ADDRESS,
                    addressVerified: ETH_ACCOUNT.descriptor,
                },
            ],
        },
    },
    {
        description: 'verifyAddress, ripple account',
        initialState: {
            suite: {
                device: AVAILABLE_DEVICE,
            },
        },
        params: {
            account: XRP_ACCOUNT,
            address: XRP_ACCOUNT.descriptor,
            path: XRP_ACCOUNT.path,
            coinmarketAction: COINMARKET_BUY.VERIFY_ADDRESS as typeof COINMARKET_BUY.VERIFY_ADDRESS,
        },
        result: {
            value: XRP_ACCOUNT.descriptor,
            actions: [
                {
                    type: COINMARKET_BUY.VERIFY_ADDRESS,
                    addressVerified: XRP_ACCOUNT.descriptor,
                },
            ],
        },
    },
    {
        description: 'verifyAddress, ripple account, unavailable device',
        initialState: {
            suite: {
                device: UNAVAILABLE_DEVICE,
            },
        },
        params: {
            account: XRP_ACCOUNT,
            address: XRP_ACCOUNT.descriptor,
            path: XRP_ACCOUNT.path,
            coinmarketAction: COINMARKET_BUY.VERIFY_ADDRESS as typeof COINMARKET_BUY.VERIFY_ADDRESS,
        },
        result: {
            value: undefined,
            actions: [
                {
                    type: MODAL.OPEN_USER_CONTEXT,
                    payload: {
                        type: 'unverified-address',
                        device: UNAVAILABLE_DEVICE,
                        address: XRP_ACCOUNT.descriptor,
                        networkType: XRP_ACCOUNT.networkType,
                        symbol: XRP_ACCOUNT.symbol,
                        addressPath: XRP_ACCOUNT.path,
                    },
                },
            ],
        },
    },
];

export const VERIFY_EXCHANGE_ADDRESS_FIXTURES = [
    {
        description: 'verifyAddress, bitcoin account, in exchange',
        initialState: {
            suite: {
                device: AVAILABLE_DEVICE,
            },
        },
        params: {
            account: BTC_ACCOUNT,
            address: BTC_ACCOUNT.addresses?.unused[0].address,
            path: BTC_ACCOUNT.addresses?.unused[0].path,
            coinmarketAction:
                COINMARKET_EXCHANGE.VERIFY_ADDRESS as typeof COINMARKET_EXCHANGE.VERIFY_ADDRESS,
        },
        result: {
            value: BTC_ACCOUNT.addresses?.unused[0].address,
            actions: [
                {
                    type: COINMARKET_EXCHANGE.VERIFY_ADDRESS,
                    addressVerified: BTC_ACCOUNT.addresses?.unused[0].address,
                },
            ],
        },
    },
];
