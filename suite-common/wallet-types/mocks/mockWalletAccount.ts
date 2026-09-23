import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { StaticSessionId } from '@trezor/connect';
import type { DeepPartial } from '@trezor/type-utils';
import { mergeDeepObject } from '@trezor/utils';

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

export const networkSpecificDefaultTron = {
    networkType: 'tron' as const,
    misc: {},
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
    misc: { reserve: '100', baseReserve: '50', stellarSequence: '0' },
    page: undefined,
    stellarCursor: undefined,
    networkType: 'stellar' as const,
};

type NetworkSpecificDefault =
    | typeof networkSpecificDefaultBitcoin
    | typeof networkSpecificDefaultEthereum
    | typeof networkSpecificDefaultTron
    | typeof networkSpecificDefaultSolana
    | typeof networkSpecificDefaultRipple
    | typeof networkSpecificDefaultCardano
    | typeof networkSpecificDefaultStellar;

// Keys stay plain literals: a branded symbol cannot type an object literal's keys. A symbol with
// no entry is caught by the lookup below rather than by the type.
const networkTypeMap: Record<string, NetworkSpecificDefault> = {
    btc: networkSpecificDefaultBitcoin,
    regtest: networkSpecificDefaultBitcoin,
    test: networkSpecificDefaultBitcoin,
    ltc: networkSpecificDefaultBitcoin,
    bch: networkSpecificDefaultBitcoin,
    doge: networkSpecificDefaultBitcoin,
    zec: networkSpecificDefaultBitcoin,

    // EVM
    eth: networkSpecificDefaultEthereum,
    etc: networkSpecificDefaultEthereum,
    hype: networkSpecificDefaultEthereum,
    pol: networkSpecificDefaultEthereum,
    bsc: networkSpecificDefaultEthereum,
    arb: networkSpecificDefaultEthereum,
    base: networkSpecificDefaultEthereum,
    op: networkSpecificDefaultEthereum,
    rhc: networkSpecificDefaultEthereum,
    avax: networkSpecificDefaultEthereum,
    tsep: networkSpecificDefaultEthereum,
    thod: networkSpecificDefaultEthereum,

    sol: networkSpecificDefaultSolana,
    dsol: networkSpecificDefaultSolana,

    // Stellar
    xlm: networkSpecificDefaultStellar,
    txlm: networkSpecificDefaultStellar,

    // Ripple
    xrp: networkSpecificDefaultRipple,
    txrp: networkSpecificDefaultRipple,

    // Cardano
    ada: networkSpecificDefaultCardano,

    // Tron
    trx: networkSpecificDefaultTron,
    ttrx: networkSpecificDefaultTron,
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
    networkSpecific?: DeepPartial<NetworkSpecificDefault>,
    accountFailure: AccountFailureSpecific = { failed: false },
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

    const networkSpecificDefault = networkTypeMap[account.symbol];

    if (!networkSpecificDefault) {
        throw new Error(`No mock defaults registered for network symbol: ${account.symbol}.`);
    }

    // The override is merged over the network default, so a test changes only the fields it needs.
    // The merged type cannot be expressed against the union, hence the assertion.
    const networkSpecificData = networkSpecific
        ? (mergeDeepObject(networkSpecificDefault, networkSpecific) as NetworkSpecificDefault)
        : networkSpecificDefault;

    // This is needed to be separated, as typing the `Account` type with the union-type of
    // the Networks and Backends seems impossible.
    // This way, we at least get type-safety for AccountBase and AccountFailureSpecific data.
    return {
        ...accountBase,
        ...accountFailure,
        ...networkSpecificData,
    };
};
