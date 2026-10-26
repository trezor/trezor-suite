import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountWithNetworkType,
    asAccountDescriptor,
    createAccountKey,
} from '@suite-common/wallet-types';
import { type PreloadedState } from '@suite-native/state';

import {
    tokenReceiveAccountInfoUSDC,
    tokenReceiveTokenUSDC,
} from './connect/tokenReceiveAccountInfoUSDC';

export const PRELOADED_TOKEN_ACCOUNT_LABEL = 'Ethereum with token balance';

const descriptor = asAccountDescriptor(tokenReceiveAccountInfoUSDC.descriptor);
const symbol = asNetworkSymbol('eth');
const deviceState = 'state@hiddenDeviceWithImportedAccounts:1';

export const portfolioTrackerUSDCTokenAccount: AccountWithNetworkType<'ethereum'> = {
    ...tokenReceiveAccountInfoUSDC,
    descriptor,
    symbol,
    deviceState,
    key: createAccountKey({
        accountDescriptor: descriptor,
        networkSymbol: symbol,
        deviceStaticSessionId: deviceState,
    }),
    accountLabel: PRELOADED_TOKEN_ACCOUNT_LABEL,
    accountType: 'normal',
    networkType: 'ethereum',
    index: 0,
    path: "m/44'/60'/0'/0/0",
    visible: true,
    imported: true,
    formattedBalance: '0',
    tokens: [{ ...tokenReceiveTokenUSDC, balance: '10' }],
    metadata: { key: descriptor },
    misc: { nonce: '0' },
    page: undefined,
    marker: undefined,
    stellarCursor: undefined,
    utxo: undefined,
};

export const portfolioTrackerUSDCTokenAccountState: PreloadedState = {
    analytics: {
        enabled: false,
        confirmed: true,
        loggerEnabled: false,
    },
    messageSystem: {
        // Keep cached experiment settings stable while exercising the account-detail route.
        timestamp: Date.now(),
        config: null,
        validExperiments: [],
    },
    wallet: {
        settings: {
            enabledNetworks: [symbol],
        },
        accounts: [portfolioTrackerUSDCTokenAccount],
        transactions: {
            transactions: {
                [portfolioTrackerUSDCTokenAccount.key]: [],
            },
        },
    },
    tokenDefinitions: {
        [symbol]: {
            coin: {
                data: [tokenReceiveTokenUSDC.contract],
                isLoading: false,
                error: false,
                hide: [],
                show: [],
            },
        },
    },
};
