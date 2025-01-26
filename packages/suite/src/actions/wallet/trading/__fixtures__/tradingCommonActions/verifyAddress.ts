import { testMocks } from '@suite-common/test-utils';
import { AddressDisplayOptions } from '@suite-common/wallet-types';

import { MODAL } from 'src/actions/suite/constants';
import { TRADING_BUY, TRADING_EXCHANGE } from 'src/actions/wallet/constants';
import {
    BTC_ACCOUNT,
    ETH_ACCOUNT,
    XRP_ACCOUNT,
} from 'src/actions/wallet/trading/__fixtures__/tradingCommonActions/accounts';

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
            suite: {
                settings: {
                    addressDisplayType: AddressDisplayOptions.CHUNKED,
                },
            },
            wallet: {
                accounts: [BTC_ACCOUNT],
            },
        },
        params: {
            account: BTC_ACCOUNT,
            address: BTC_ACCOUNT.addresses?.unused[0].address,
            path: BTC_ACCOUNT.addresses?.unused[0].path,
            tradingAction: TRADING_BUY.VERIFY_ADDRESS as typeof TRADING_BUY.VERIFY_ADDRESS,
        },
        result: {
            value: BTC_ACCOUNT.addresses?.unused[0].address,
            action: {
                type: TRADING_BUY.VERIFY_ADDRESS,
                addressVerified: BTC_ACCOUNT.addresses?.unused[0].address,
            },
        },
    },
    {
        description: 'verifyAddress, ethereum account',
        initialState: {
            device: {
                selectedDevice: AVAILABLE_DEVICE,
            },
            suite: {
                settings: {
                    addressDisplayType: AddressDisplayOptions.CHUNKED,
                },
            },
            wallet: {
                accounts: [ETH_ACCOUNT],
            },
        },
        params: {
            account: ETH_ACCOUNT,
            address: ETH_ACCOUNT.descriptor,
            path: ETH_ACCOUNT.path,
            tradingAction: TRADING_BUY.VERIFY_ADDRESS as typeof TRADING_BUY.VERIFY_ADDRESS,
        },
        result: {
            value: ETH_ACCOUNT.descriptor,
            action: {
                type: TRADING_BUY.VERIFY_ADDRESS,
                addressVerified: ETH_ACCOUNT.descriptor,
            },
        },
    },
    {
        description: 'verifyAddress, ripple account',
        initialState: {
            device: {
                selectedDevice: AVAILABLE_DEVICE,
            },
            suite: {
                settings: {
                    addressDisplayType: AddressDisplayOptions.CHUNKED,
                },
            },
            wallet: {
                accounts: [XRP_ACCOUNT],
            },
        },
        params: {
            account: XRP_ACCOUNT,
            address: XRP_ACCOUNT.descriptor,
            path: XRP_ACCOUNT.path,
            tradingAction: TRADING_BUY.VERIFY_ADDRESS as typeof TRADING_BUY.VERIFY_ADDRESS,
        },
        result: {
            value: XRP_ACCOUNT.descriptor,
            action: {
                type: TRADING_BUY.VERIFY_ADDRESS,
                addressVerified: XRP_ACCOUNT.descriptor,
            },
        },
    },
    {
        description: 'verifyAddress, ripple account, unavailable device',
        initialState: {
            device: {
                selectedDevice: UNAVAILABLE_DEVICE,
            },
            suite: {
                settings: {
                    addressDisplayType: AddressDisplayOptions.CHUNKED,
                },
            },
            wallet: {
                accounts: [XRP_ACCOUNT],
            },
        },
        params: {
            account: XRP_ACCOUNT,
            address: XRP_ACCOUNT.descriptor,
            path: XRP_ACCOUNT.path,
            tradingAction: TRADING_BUY.VERIFY_ADDRESS as typeof TRADING_BUY.VERIFY_ADDRESS,
        },
        result: {
            value: undefined,
            action: {
                type: MODAL.OPEN_USER_CONTEXT,
                payload: {
                    type: 'unverified-address-proceed',
                    value: XRP_ACCOUNT.descriptor,
                },
            },
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
            suite: {
                settings: {
                    addressDisplayType: AddressDisplayOptions.CHUNKED,
                },
            },
            wallet: {
                accounts: [BTC_ACCOUNT],
            },
        },
        params: {
            account: BTC_ACCOUNT,
            address: BTC_ACCOUNT.addresses?.unused[0].address,
            path: BTC_ACCOUNT.addresses?.unused[0].path,
            tradingAction:
                TRADING_EXCHANGE.VERIFY_ADDRESS as typeof TRADING_EXCHANGE.VERIFY_ADDRESS,
        },
        result: {
            value: BTC_ACCOUNT.addresses?.unused[0].address,
            action: {
                type: TRADING_EXCHANGE.VERIFY_ADDRESS,
                addressVerified: BTC_ACCOUNT.addresses?.unused[0].address,
            },
        },
    },
];
