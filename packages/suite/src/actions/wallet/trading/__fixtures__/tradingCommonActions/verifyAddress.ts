import { testMocks } from '@suite-common/test-utils';
import { AddressDisplayOptions } from '@suite-common/wallet-types';

import { TRADING_EXCHANGE } from 'src/actions/wallet/constants';
import { BTC_ACCOUNT } from 'src/actions/wallet/trading/__fixtures__/tradingCommonActions/accounts';

const { getSuiteDevice } = testMocks;
const AVAILABLE_DEVICE = getSuiteDevice({ available: true, connected: true });

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
