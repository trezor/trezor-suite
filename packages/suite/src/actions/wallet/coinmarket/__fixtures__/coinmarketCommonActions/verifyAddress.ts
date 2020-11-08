import { MODAL } from '@suite-actions/constants';
import { BTC_ACCOUNT, ETH_ACCOUNT, XRP_ACCOUNT } from './accounts';
import { COINMARKET_BUY, COINMARKET_EXCHANGE } from '@wallet-actions/constants';

const { getSuiteDevice } = global.JestMocks;
const UNAVAILABLE_DEVICE = getSuiteDevice({ available: false });
const AVAILABLE_DEVICE = getSuiteDevice({ available: true, connected: true });

export const VERIFY_ADDRESS_FIXTURES = [
    {
        description: 'verifyAddress, bitcoin account',
        initialState: {
            suite: {
                device: AVAILABLE_DEVICE,
            },
        },
        params: {
            account: BTC_ACCOUNT,
            inExchange: false,
        },
        result: {
            value: BTC_ACCOUNT.addresses?.unused[0].address,
            actions: [
                {
                    type: MODAL.OPEN_USER_CONTEXT,
                    payload: {
                        type: 'address',
                        device: AVAILABLE_DEVICE,
                        address: BTC_ACCOUNT.addresses?.unused[0].address,
                        networkType: BTC_ACCOUNT.networkType,
                        symbol: BTC_ACCOUNT.symbol,
                        addressPath: BTC_ACCOUNT.addresses?.unused[0].path,
                    },
                },
                {
                    type: COINMARKET_BUY.VERIFY_ADDRESS,
                    addressVerified: BTC_ACCOUNT.addresses?.unused[0].address,
                },
            ],
        },
    },
    {
        description: 'verifyAddress, bitcoin account',
        initialState: {
            suite: {
                device: AVAILABLE_DEVICE,
            },
        },
        params: {
            account: BTC_ACCOUNT,
            inExchange: false,
        },
        result: {
            value: BTC_ACCOUNT.addresses?.unused[0].address,
            actions: [
                {
                    type: MODAL.OPEN_USER_CONTEXT,
                    payload: {
                        type: 'address',
                        device: AVAILABLE_DEVICE,
                        address: BTC_ACCOUNT.addresses?.unused[0].address,
                        networkType: BTC_ACCOUNT.networkType,
                        symbol: BTC_ACCOUNT.symbol,
                        addressPath: BTC_ACCOUNT.addresses?.unused[0].path,
                    },
                },
                {
                    type: COINMARKET_BUY.VERIFY_ADDRESS,
                    addressVerified: BTC_ACCOUNT.addresses?.unused[0].address,
                },
            ],
        },
    },
    {
        description: 'verifyAddress, bitcoin account, in exchange',
        initialState: {
            suite: {
                device: AVAILABLE_DEVICE,
            },
        },
        params: {
            account: BTC_ACCOUNT,
            inExchange: true,
        },
        result: {
            value: BTC_ACCOUNT.addresses?.unused[0].address,
            actions: [
                {
                    type: MODAL.OPEN_USER_CONTEXT,
                    payload: {
                        type: 'address',
                        device: AVAILABLE_DEVICE,
                        address: BTC_ACCOUNT.addresses?.unused[0].address,
                        networkType: BTC_ACCOUNT.networkType,
                        symbol: BTC_ACCOUNT.symbol,
                        addressPath: BTC_ACCOUNT.addresses?.unused[0].path,
                    },
                },
                {
                    type: COINMARKET_EXCHANGE.VERIFY_ADDRESS,
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
            inExchange: false,
        },
        result: {
            value: ETH_ACCOUNT.descriptor,
            actions: [
                {
                    type: MODAL.OPEN_USER_CONTEXT,
                    payload: {
                        type: 'address',
                        device: AVAILABLE_DEVICE,
                        address: ETH_ACCOUNT.descriptor,
                        networkType: ETH_ACCOUNT.networkType,
                        symbol: ETH_ACCOUNT.symbol,
                        addressPath: ETH_ACCOUNT.path,
                    },
                },
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
            inExchange: false,
        },
        result: {
            value: XRP_ACCOUNT.descriptor,
            actions: [
                {
                    type: MODAL.OPEN_USER_CONTEXT,
                    payload: {
                        type: 'address',
                        device: AVAILABLE_DEVICE,
                        address: XRP_ACCOUNT.descriptor,
                        networkType: XRP_ACCOUNT.networkType,
                        symbol: XRP_ACCOUNT.symbol,
                        addressPath: XRP_ACCOUNT.path,
                    },
                },
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
            inExchange: false,
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
