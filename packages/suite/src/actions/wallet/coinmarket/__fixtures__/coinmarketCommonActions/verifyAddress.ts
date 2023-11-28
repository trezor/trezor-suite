import { testMocks } from '@suite-common/test-utils';

import { MODAL } from 'src/actions/suite/constants';
import { COINMARKET_BUY, COINMARKET_EXCHANGE } from 'src/actions/wallet/constants';

import { BTC_ACCOUNT, ETH_ACCOUNT, XRP_ACCOUNT } from './accounts';

const { getSuiteDevice } = testMocks;
const UNAVAILABLE_DEVICE = getSuiteDevice({ available: false });
const AVAILABLE_DEVICE = getSuiteDevice({ available: true, connected: true });

export const VERIFY_BUY_ADDRESS_FIXTURES = [
    {
        description: 'verifyAddress, bitcoin account',
        initialState: {
            device: {
                selectedDevice: AVAILABLE_DEVICE,
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
            device: {
                selectedDevice: AVAILABLE_DEVICE,
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
            device: {
                selectedDevice: AVAILABLE_DEVICE,
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
            device: {
                selectedDevice: UNAVAILABLE_DEVICE,
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
                        value: XRP_ACCOUNT.descriptor,
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
            device: {
                selectedDevice: AVAILABLE_DEVICE,
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
