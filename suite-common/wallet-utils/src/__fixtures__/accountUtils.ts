import { asNetworkSymbol } from '@suite-common/wallet-config';
import { CARDANO_EVERSTAKE_DREP } from '@suite-common/wallet-constants';
import type { Account, AccountWithNetworkType } from '@suite-common/wallet-types';
import {
    mockAccountToken,
    mockWalletAccount,
    networkSpecificDefaultCardano,
} from '@suite-common/wallet-types/mocks';
import type { AccountInfo, TokenInfo } from '@trezor/connect';
import type { Bip43Path, Bip43PathTemplate } from '@trezor/crypto-utils';

export const sortByCoin = [
    {
        accounts: [
            { symbol: 'btc', index: 0, accountType: 'legacy' },
            { symbol: 'test', index: 1, accountType: 'normal' },
            { symbol: 'test', index: 0, accountType: 'normal' },
            { symbol: 'btc', index: 0, accountType: 'segwit' },
            { symbol: 'test', index: 0, accountType: 'segwit' },
            { symbol: 'test', index: 1, accountType: 'legacy' },
            { symbol: 'test', index: 0, accountType: 'legacy' },
            { symbol: 'btc', index: 1, accountType: 'normal' },
            { symbol: 'btc', index: 0, accountType: 'normal' },
        ],
        result: [
            { symbol: 'btc', index: 0, accountType: 'normal' },
            { symbol: 'btc', index: 1, accountType: 'normal' },
            { symbol: 'btc', index: 0, accountType: 'segwit' },
            { symbol: 'btc', index: 0, accountType: 'legacy' },
            { symbol: 'test', index: 0, accountType: 'normal' },
            { symbol: 'test', index: 1, accountType: 'normal' },
            { symbol: 'test', index: 0, accountType: 'segwit' },
            { symbol: 'test', index: 0, accountType: 'legacy' },
            { symbol: 'test', index: 1, accountType: 'legacy' },
        ],
    },
];

export const getBip43Type = [
    {
        description: 'bitcoin taproot',
        path: "m/86'/0'/0'",
        result: 'bip86',
    },
    {
        description: 'bitcoin segwit',
        path: "m/84'/0'/0'",
        result: 'bip84',
    },
    {
        description: 'bitcoin legacy segwit',
        path: "m/49'/0'/0'",
        result: 'bip49',
    },
    {
        description: 'bitcoin legacy',
        path: "m/44'/0'/0'",
        result: 'bip44',
    },
    {
        description: 'bitcoin coinjoin',
        path: "m/10025'/0'/0'",
        result: 'slip25',
    },
    {
        description: 'litecoin segwit',
        path: "m/84'/2'/0'",
        result: 'bip84',
    },
    {
        description: 'litecoin legacy segwit',
        path: "m/49'/2'/0'",
        result: 'bip49',
    },
    {
        description: 'litecoin legacy',
        path: "m/44'/2'/0'",
        result: 'bip44',
    },
    {
        description: 'vertcoin segwit',
        path: "m/84'/28'/0'",
        result: 'bip84',
    },
    {
        description: 'vertcoin legacy segwit',
        path: "m/49'/28'/0'",
        result: 'bip49',
    },
    {
        description: 'vertcoin legacy',
        path: "m/44'/28'/0'",
        result: 'bip44',
    },
    {
        description: 'unknown',
        path: 'm/',
        result: 'unknown',
    },
    {
        description: 'invalid path',
        path: 'invalid-string',
        result: 'unknown',
    },
    {
        description: 'invalid path type',
        path: undefined,
        result: 'unknown',
    },
];

type SubstituteBip43PathFixture = {
    description: string;
    pathTemplate: Bip43PathTemplate;
    index?: number | string;
    result: Bip43Path;
};
export const substituteBip43Path: SubstituteBip43PathFixture[] = [
    {
        description: 'numerical index',
        pathTemplate: "m/84'/0'/i'",
        index: 7,
        result: "m/84'/0'/7'",
    },
    {
        description: 'stringified index',
        pathTemplate: "m/44'/0'/i'/0",
        index: '14',
        result: "m/44'/0'/14'/0",
    },
    {
        description: 'default index',
        pathTemplate: "m/10025'/1'/i'/1'",
        result: "m/10025'/1'/0'/1'",
    },
];

export const getUtxoFromSignedTransaction = [
    {
        description: 'regular tx, 1 new utxo',
        params: {
            account: {
                addresses: {
                    used: [],
                    unused: [],
                    change: [
                        { path: '/1/0', address: 'A-change' },
                        { path: '/1/1', address: 'B-change' },
                    ],
                },
                utxo: [
                    { txid: '0000', vout: 0, amount: '4' },
                    { txid: '0000', vout: 1, amount: '5' },
                ],
            },
            tx: {
                type: 'final',
                inputs: [{ prev_hash: '0000', prev_index: 1 }],
                outputs: [
                    { address: 'external', amount: '2' },
                    { address_n: [0, 0, 0, 1, 1], amount: '1' },
                ],
            },
            txid: 'ABCD',
        },
        result: [
            { txid: 'ABCD', vout: 1, amount: '1', address: 'B-change', path: '/1/1' },
            { txid: '0000', vout: 0, amount: '4' },
        ],
    },
    {
        description: 'cardano tx, 1 new change utxo',
        params: {
            account: {
                addresses: {
                    used: [],
                    unused: [],
                    change: [
                        { path: "m/1852'/1815'/0'/1/0", address: 'A-change' },
                        { path: "m/1852'/1815'/0'/1/1", address: 'B-change' },
                    ],
                },
                utxo: [
                    { txid: '0000', vout: 0, amount: '4' },
                    { txid: '0000', vout: 1, amount: '5' },
                ],
            },
            tx: {
                type: 'final',
                inputs: [{ prev_hash: '0000', prev_index: 1 }],
                outputs: [
                    { address: 'external', amount: '2' },
                    {
                        addressParameters: { addressType: 0, path: "m/1852'/1815'/0'/1/1" },
                        amount: '1',
                    },
                ],
            },
            txid: 'ABCD',
        },
        result: [
            {
                txid: 'ABCD',
                vout: 1,
                amount: '1',
                address: 'B-change',
                path: "m/1852'/1815'/0'/1/1",
            },
            { txid: '0000', vout: 0, amount: '4' },
        ],
    },
    {
        description: 'cardano tx, change utxo with token bundle keeps lovelace amount',
        params: {
            account: {
                addresses: {
                    used: [],
                    unused: [],
                    change: [{ path: "m/1852'/1815'/0'/1/0", address: 'A-change' }],
                },
                utxo: [{ txid: '0000', vout: 0, amount: '10' }],
            },
            tx: {
                type: 'final',
                inputs: [{ prev_hash: '0000', prev_index: 0 }],
                outputs: [
                    { address: 'external', amount: '2' },
                    {
                        addressParameters: { addressType: 0, path: "m/1852'/1815'/0'/1/0" },
                        amount: '3',
                        tokenBundle: [
                            {
                                policyId: 'policy',
                                tokenAmounts: [{ assetNameBytes: '', amount: '7' }],
                            },
                        ],
                    },
                ],
            },
            txid: 'ABCD',
        },
        result: [
            {
                txid: 'ABCD',
                vout: 1,
                amount: '3',
                address: 'A-change',
                path: "m/1852'/1815'/0'/1/0",
            },
        ],
    },
    {
        description: 'regular tx, multiple outputs, multiple new utxos',
        params: {
            account: {
                addresses: {
                    used: [
                        { path: '/0/0', address: 'A' },
                        { path: '/0/1', address: 'B' },
                    ],
                    unused: [
                        { path: '/0/2', address: 'C' },
                        { path: '/0/3', address: 'D' },
                    ],
                    change: [
                        { path: '/1/0', address: 'A-change' },
                        { path: '/1/1', address: 'B-change' },
                    ],
                },
                utxo: [
                    { txid: '0000', vout: 0, amount: '20' },
                    { txid: '0000', vout: 1, amount: '10' },
                ],
            },
            tx: {
                type: 'final',
                inputs: [{ prev_hash: '0000', prev_index: 1 }],
                outputs: [
                    { address: 'external', amount: '0.1' },
                    { address: 'B', amount: '2' },
                    { address: 'external', amount: '0.1' },
                    { address: 'D', amount: '3' },
                    { address: 'external', amount: '0.1' },
                    { address: 'A-change', amount: '4' },
                    { address: 'external', amount: '0.1' },
                    { address_n: [0, 0, 0, 1, 1], amount: '5' },
                ],
            },
            txid: 'ABCD',
        },
        result: [
            { txid: 'ABCD', vout: 7, amount: '5', address: 'B-change', path: '/1/1' },
            { txid: 'ABCD', vout: 5, amount: '4', address: 'A-change', path: '/1/0' },
            { txid: 'ABCD', vout: 3, amount: '3', address: 'D', path: '/0/3' },
            { txid: 'ABCD', vout: 1, amount: '2', address: 'B', path: '/0/1' },
            { txid: '0000', vout: 0, amount: '20' },
        ],
    },
    {
        description: 'rbf tx, 1 utxo changed',
        params: {
            account: {
                addresses: {
                    used: [],
                    unused: [],
                    change: [
                        { path: '/1/0', address: 'A-change' },
                        { path: '/1/1', address: 'B-change' },
                    ],
                },
                utxo: [
                    { txid: '0000', vout: 0, amount: '10', address: 'B-change' },
                    { txid: 'ABCD', vout: 1, amount: '5', address: 'B-change' },
                ],
            },
            tx: {
                type: 'final',
                inputs: [{ prev_hash: '9876', prev_index: 2 }],
                outputs: [
                    { address: 'external', amount: '2' },
                    { address_n: [0, 0, 0, 1, 1], amount: '4' },
                ],
            },
            txid: 'DBCA',
            prevTxid: 'ABCD',
        },
        result: [
            { txid: 'DBCA', vout: 1, amount: '4', address: 'B-change', path: '/1/1' },
            { txid: '0000', vout: 0, amount: '10' },
        ],
    },
    {
        description: 'rbf tx, multiple utxos changed, 1 utxo ignored',
        params: {
            account: {
                addresses: {
                    used: [
                        { path: '/0/0', address: 'A' },
                        { path: '/0/1', address: 'B' },
                    ],
                    unused: [],
                    change: [
                        { path: '/1/0', address: 'A-change' },
                        { path: '/1/1', address: 'B-change' },
                    ],
                },
                utxo: [
                    { txid: '0000', vout: 0, amount: '10', address: 'B-change' },
                    { txid: 'ABCD', vout: 3, amount: '5', address: 'B-change' },
                    { txid: 'ABCD', vout: 1, amount: '5', address: 'B' },
                ],
            },
            tx: {
                type: 'final',
                inputs: [{ prev_hash: '9876', prev_index: 2 }],
                outputs: [
                    { address: 'external', amount: '2' },
                    { address: 'B', amount: '5' },
                    { address: 'A', amount: '5' },
                    { address_n: [0, 0, 0, 1, 1], amount: '4' },
                ],
            },
            txid: 'DBCA',
            prevTxid: 'ABCD',
        },
        result: [
            // A should be ignored since it's not present in Account.utxo (its spent)
            { txid: 'DBCA', vout: 3, amount: '4', address: 'B-change', path: '/1/1' },
            { txid: 'DBCA', vout: 1, amount: '5', address: 'B', path: '/0/1' },
            { txid: '0000', vout: 0, amount: '10' },
        ],
    },
    {
        description: 'rbf tx, all utxos ignored',
        params: {
            account: {
                addresses: {
                    used: [
                        { path: '/0/0', address: 'A' },
                        { path: '/0/1', address: 'B' },
                    ],
                    unused: [],
                    change: [
                        { path: '/1/0', address: 'A-change' },
                        { path: '/1/1', address: 'B-change' },
                    ],
                },
                utxo: [{ txid: '0000', vout: 0, amount: '10', address: 'B-change' }],
            },
            tx: {
                type: 'final',
                inputs: [{ prev_hash: '9876', prev_index: 2 }],
                outputs: [
                    { address: 'external', amount: '2' },
                    { address: 'B', amount: '5' },
                    { address: 'A', amount: '5' },
                    { address_n: [0, 0, 0, 1, 1], amount: '4' },
                ],
            },
            txid: 'DBCA',
            prevTxid: 'ABCD',
        },
        result: [{ txid: '0000', vout: 0, amount: '10' }],
    },
    {
        description: 'account without addresses/utxos',
        params: {
            account: {},
            tx: {
                type: 'final',
                inputs: [{ prev_hash: '0000', prev_index: 1 }],
                outputs: [
                    { address: 'external', amount: '2' },
                    { address_n: [0, 0, 0, 1, 1], amount: '1' },
                ],
            },
            txid: 'ABCD',
        },
        result: [],
    },
    {
        description: 'tx not final',
        params: { account: {}, tx: { type: 'nonfinal' }, txid: 'ABCD' },
        result: [],
    },
];

type CardanoStaking = AccountWithNetworkType<'cardano'>['misc']['staking'];
type CardanoDrep = NonNullable<CardanoStaking['drep']>;

const drep: CardanoDrep = {
    drep_id: CARDANO_EVERSTAKE_DREP.bech32,
    hex: CARDANO_EVERSTAKE_DREP.hex,
    amount: '1000000000',
    active: true,
    active_epoch: 507,
    has_script: false,
};

// only `drep_id` is compared, so any other id will do
const otherDrep = {
    ...drep,
    drep_id: 'drep1ygdzk0zdtehhpqvj5w6vt4h8lqy352euf40x7uypj23mf3gs6c9xy',
};

const staking = (drepOverride: CardanoDrep | null): CardanoStaking => ({
    ...networkSpecificDefaultCardano.misc.staking,
    drep: drepOverride,
});

// equal on both sides, so the tx count checks preceding the staking comparison can't mask its result
const history = { total: 13, unconfirmed: 0 };

const drepCases: {
    description: string;
    stored: CardanoDrep | null;
    fresh: CardanoDrep | null;
    result: boolean;
}[] = [
    { description: 'identical staking data', stored: drep, fresh: drep, result: false },
    {
        description: "only the DRep's voting power changed",
        stored: drep,
        fresh: { ...drep, amount: '2000000000' },
        result: false,
    },
    { description: 'vote changed to another DRep', stored: drep, fresh: otherDrep, result: true },
    {
        description: 'first vote delegation, stored DRep is null',
        stored: null,
        fresh: drep,
        result: true,
    },
    { description: 'vote delegation dropped', stored: drep, fresh: null, result: true },
    {
        description: 'same DRep, retired since last fetch',
        stored: drep,
        fresh: { ...drep, active: false },
        result: true,
    },
    {
        description: 'same DRep, re-registered in a later epoch',
        stored: drep,
        fresh: { ...drep, active_epoch: 512 },
        result: true,
    },
];

const cardanoAccount = (stakingOverride: CardanoStaking) =>
    ({
        ...mockWalletAccount({ symbol: asNetworkSymbol('ada'), history }),
        misc: { staking: stakingOverride },
    }) as AccountWithNetworkType<'cardano'>;

const delegatedStaking: CardanoStaking = {
    address: 'stake1uxzutrtmxwv2rf2j3hdpps66ch0jydmkr58vwgnetddcdwg32u4rc',
    isActive: true,
    rewards: '173289',
    poolId: 'pool1pu5jlj4q9w9jlxeu370a3c9myx47md5j5m2str0naunn2q3lkdy',
    drep,
};

const cardanoOutdatedCases = [
    ...drepCases.map(({ description, stored, fresh, result }) => ({
        description: `cardano: ${description}`,
        account: cardanoAccount(staking(stored)),
        freshInfo: { history, misc: { staking: staking(fresh) } } as AccountInfo,
        result,
    })),
    {
        description: 'cardano: fresh info without a staking block leaves a delegated account as is',
        account: cardanoAccount(delegatedStaking),
        freshInfo: { history, misc: undefined } as AccountInfo,
        result: false,
    },
    {
        description: 'cardano: fresh info without a staking block still reacts to new transactions',
        account: cardanoAccount(delegatedStaking),
        freshInfo: { history: { ...history, total: history.total + 1 } } as AccountInfo,
        result: true,
    },
];

const notDelegatedStaking: CardanoStaking = {
    address: '',
    isActive: false,
    rewards: '0',
    poolId: null,
    drep: null,
};

const cardanoPage = { index: 1, size: 25, total: 1 };

const cardanoSpecific = (stakingResult: CardanoStaking, page?: AccountInfo['page']) => ({
    networkType: 'cardano' as const,
    misc: { staking: stakingResult },
    marker: undefined,
    stellarCursor: undefined,
    page,
});

export const getAccountSpecific: {
    description: string;
    params: {
        accountInfo: Partial<AccountInfo>;
        networkType: 'cardano';
        storedAccount?: Account;
    };
    result: ReturnType<typeof cardanoSpecific>;
}[] = [
    {
        description: 'cardano: takes the staking block of the fresh info over the stored one',
        params: {
            accountInfo: { misc: { staking: staking(null) }, page: cardanoPage },
            networkType: 'cardano',
            storedAccount: cardanoAccount(delegatedStaking),
        },
        result: cardanoSpecific(staking(null), cardanoPage),
    },
    {
        description: 'cardano: keeps the stored staking block when the fresh info has none',
        params: {
            accountInfo: { page: cardanoPage },
            networkType: 'cardano',
            storedAccount: cardanoAccount(delegatedStaking),
        },
        result: cardanoSpecific(delegatedStaking, cardanoPage),
    },
    {
        description: 'cardano: defaults to not staking when nothing is known',
        params: {
            accountInfo: {},
            networkType: 'cardano',
        },
        result: cardanoSpecific(notDelegatedStaking),
    },
    {
        description: 'cardano: ignores a stored account of another network',
        params: {
            accountInfo: {},
            networkType: 'cardano',
            storedAccount: mockWalletAccount({ symbol: asNetworkSymbol('btc') }),
        },
        result: cardanoSpecific(notDelegatedStaking),
    },
];

const USDC_CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const usdcInfo = (balance: string): TokenInfo => ({
    standard: 'ERC20',
    contract: USDC_CONTRACT,
    balance,
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
});
const storedUsdc = (balance: string) =>
    mockAccountToken({ contract: USDC_CONTRACT, symbol: 'USDC', decimals: 6, balance });

// The count covers only the scanned window, so an unchanged count on both sides leaves the token
// list as the one thing that can give a token transfer away.
const evmRpcHistory = { total: 3, unconfirmed: 0 };
const unscannedHistory = { total: -1, unconfirmed: 0 };
const evmAccount = (
    backendType: 'blockbook' | 'evm-rpc',
    tokens: AccountWithNetworkType<'ethereum'>['tokens'],
    accountHistory = evmRpcHistory,
    isRateLimited?: boolean,
) =>
    ({
        ...mockWalletAccount({
            symbol: asNetworkSymbol('eth'),
            balance: '0',
            history: accountHistory,
            tokens,
        }),
        misc: { nonce: '0', ...(isRateLimited && { isRateLimited }) },
        backendType,
    }) as AccountWithNetworkType<'ethereum'>;
const evmFreshInfo = (
    tokens: TokenInfo[] | undefined,
    freshHistory = evmRpcHistory,
    isRateLimited?: boolean,
) =>
    ({
        balance: '0',
        history: freshHistory,
        misc: { nonce: '0', ...(isRateLimited && { isRateLimited }) },
        tokens,
    }) as AccountInfo;

const evmTokenCases = [
    {
        description: 'direct rpc: a token the account did not have',
        account: evmAccount('evm-rpc', []),
        freshInfo: evmFreshInfo([usdcInfo('500')]),
        result: true,
    },
    {
        description: 'direct rpc: same token, same balance',
        account: evmAccount('evm-rpc', [storedUsdc('0.0005')]),
        freshInfo: evmFreshInfo([usdcInfo('500')]),
        result: false,
    },
    {
        description: 'direct rpc: token balance moved',
        account: evmAccount('evm-rpc', [storedUsdc('0.0005')]),
        freshInfo: evmFreshInfo([usdcInfo('700')]),
        result: true,
    },
    {
        description: 'direct rpc: held token no longer reported',
        account: evmAccount('evm-rpc', [storedUsdc('0.0005')]),
        freshInfo: evmFreshInfo(undefined),
        result: true,
    },
    {
        description: 'direct rpc: hand-added token at zero is not reported back',
        account: evmAccount('evm-rpc', [storedUsdc('0')]),
        freshInfo: evmFreshInfo(undefined),
        result: false,
    },
    {
        description: 'direct rpc: history never scanned, so its transactions were never fetched',
        account: evmAccount('evm-rpc', [], unscannedHistory),
        freshInfo: evmFreshInfo(undefined, unscannedHistory),
        result: true,
    },
    {
        description: 'direct rpc: a rate limit cost the fresh answer part of what it should hold',
        account: evmAccount('evm-rpc', []),
        freshInfo: evmFreshInfo(undefined, evmRpcHistory, true),
        result: true,
    },
    {
        description:
            'direct rpc: the answer that a rate limit left incomplete can now be completed',
        account: evmAccount('evm-rpc', [], evmRpcHistory, true),
        freshInfo: evmFreshInfo(undefined),
        result: true,
    },
    {
        description: 'blockbook: token list is not compared',
        account: evmAccount('blockbook', []),
        freshInfo: evmFreshInfo([usdcInfo('500')]),
        result: false,
    },
];

export const isAccountOutdated = [...cardanoOutdatedCases, ...evmTokenCases];
