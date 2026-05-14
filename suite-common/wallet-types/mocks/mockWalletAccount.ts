import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { StaticSessionId } from '@trezor/connect';

import {
    Account,
    AccountBase,
    AccountFailureSpecific,
    asAccountDescriptor,
    createAccountKey,
} from '../src/account';

const networkSpecificDefaultBitcoin = {
    networkType: 'bitcoin' as const,
    misc: undefined,
    marker: undefined,
    stellarCursor: undefined,
    page: { index: 1, size: 25, total: 1 },
};

export const networkSpecificDefaultEthereum = {
    networkType: 'ethereum' as const,
    misc: { nonce: '6' },
    marker: undefined,
    stellarCursor: undefined,
    page: { index: 1, size: 25, total: 1 },
};

export const networkSpecificDefaultSolana = {
    networkType: 'solana' as const,
    marker: undefined,
    stellarCursor: undefined,
    page: { index: 1, size: 25, total: 1 },
};

export const networkSpecificDefaultRipple = {
    networkType: 'ripple' as const,
    marker: undefined,
    stellarCursor: undefined,
    misc: { sequence: 0, reserve: '21' },
    page: undefined,
};

export const networkSpecificDefaultCardano = {
    networkType: 'cardano' as const,
    marker: undefined,
    stellarCursor: undefined,
    misc: {
        staking: {
            address: '',
            isActive: true,
            rewards: '',
            poolId: null,
            drep: null,
        },
    },
    page: undefined,
};

export const networkSpecificDefaultStellar = {
    marker: undefined,
    misc: { reserve: '100', stellarSequence: '0' },
    page: undefined,
    stellarCursor: undefined,
    networkType: 'stellar' as const,
};

type NetworkSpecificDefault =
    | typeof networkSpecificDefaultBitcoin
    | typeof networkSpecificDefaultEthereum
    | typeof networkSpecificDefaultSolana
    | typeof networkSpecificDefaultRipple
    | typeof networkSpecificDefaultCardano
    | typeof networkSpecificDefaultStellar;

const networkTypeMap: Record<NetworkSymbol, NetworkSpecificDefault> = {
    // Bitcoin-like
    btc: networkSpecificDefaultBitcoin,
    regtest: networkSpecificDefaultBitcoin,
    test: networkSpecificDefaultBitcoin,
    ltc: networkSpecificDefaultBitcoin,
    bch: networkSpecificDefaultBitcoin,
    doge: networkSpecificDefaultBitcoin,

    // Eth
    eth: networkSpecificDefaultEthereum,
    etc: networkSpecificDefaultEthereum,

    // Solana
    sol: networkSpecificDefaultSolana,
    dsol: networkSpecificDefaultSolana,

    // Stellar
    xlm: networkSpecificDefaultBitcoin,

    // Todo: fix map for remaining networks
    xrp: networkSpecificDefaultBitcoin,
    zec: networkSpecificDefaultBitcoin,
    ada: networkSpecificDefaultBitcoin,
    pol: networkSpecificDefaultBitcoin,
    bsc: networkSpecificDefaultBitcoin,
    arb: networkSpecificDefaultBitcoin,
    base: networkSpecificDefaultBitcoin,
    op: networkSpecificDefaultBitcoin,
    avax: networkSpecificDefaultBitcoin,
    trx: networkSpecificDefaultBitcoin,
    ttrx: networkSpecificDefaultBitcoin,
    tsep: networkSpecificDefaultBitcoin,
    thod: networkSpecificDefaultBitcoin,
    txrp: networkSpecificDefaultBitcoin,
    txlm: networkSpecificDefaultBitcoin,
};

type MandatoryAccountData = {
    symbol: NetworkSymbol;
};

const DEFAULT_DEVICE_STATIC_SESSION_ID: StaticSessionId = '1stTestnetAddress@device_id:0';

export const mockWalletAccount = (
    account: Omit<
        Partial<AccountBase>,
        | 'key' // key is always constructed inside to enforce consistency
        | 'symbol'
    > &
        MandatoryAccountData,
    networkSpecific?: NetworkSpecificDefault,
): Account => {
    const descriptor = account.descriptor ?? asAccountDescriptor(account.symbol);

    const accountBase: AccountBase = {
        index: 0,
        path: "m/44'/60'/0'/0/1",
        accountType: 'normal',
        empty: false,
        visible: true,
        balance: '0',
        availableBalance: '0',
        formattedBalance: '0',
        tokens: [],
        history: { total: 13, tokens: 0, unconfirmed: 0 },

        utxo: undefined,
        addresses: undefined,
        metadata: { key: 'xpub' },
        ts: 0,
        ...account,

        // This is mandatory to pass to enforce consistency
        deviceState: account.deviceState ?? DEFAULT_DEVICE_STATIC_SESSION_ID,
        descriptor,
        key: createAccountKey({
            accountDescriptor: descriptor,
            networkSymbol: account.symbol,
            deviceStaticSessionId: account.deviceState ?? DEFAULT_DEVICE_STATIC_SESSION_ID,
        }),
        symbol: account.symbol,
    };

    // This is needed as typing the `Account` type with the union-type of
    // the Networks and Backends seems impossible.
    // This way, we at least get type-safe for AccountBase data.

    const accountFailure: AccountFailureSpecific = {
        failed: false,
    };

    return {
        ...accountBase,
        ...accountFailure,
        ...(networkSpecific ?? networkTypeMap[account.symbol]),
    };
};
