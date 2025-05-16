import type { BlockchainLinkParams } from '@trezor/blockchain-link';

import { PROTO } from '../../constants';
import type { AccountInfo } from '../account';
import type { Params, Response } from '../params';

export const ACCOUNT_TYPES = [
    { symbol: 'btc', type: 'normal', path: "m/84'/0'/i'" },
    { symbol: 'btc', type: 'taproot', path: "m/86'/0'/i'" },
    { symbol: 'btc', type: 'segwit', path: "m/49'/0'/i'" },
    { symbol: 'btc', type: 'legacy', path: "m/44'/0'/i'" },
    { symbol: 'test', type: 'normal', path: "m/84'/1'/i'" },
    { symbol: 'test', type: 'taproot', path: "m/86'/1'/i'" },
    { symbol: 'test', type: 'segwit', path: "m/49'/1'/i'" },
    { symbol: 'test', type: 'legacy', path: "m/44'/1'/i'" },
    { symbol: 'regtest', type: 'normal', path: "m/84'/1'/i'" },
    { symbol: 'regtest', type: 'taproot', path: "m/86'/1'/i'" },
    { symbol: 'regtest', type: 'segwit', path: "m/49'/1'/i'" },
    { symbol: 'regtest', type: 'legacy', path: "m/44'/1'/i'" },
    { symbol: 'eth', type: 'normal', path: "m/44'/60'/0'/0/i" },
    { symbol: 'eth', type: 'ledger', path: "m/44'/60'/i'/0/0" },
    { symbol: 'eth', type: 'legacy', path: "m/44'/60'/0'/i" },
    { symbol: 'tsep', type: 'normal', path: "m/44'/1'/0'/0/i" },
    { symbol: 'thol', type: 'normal', path: "m/44'/1'/0'/0/i" },
    { symbol: 'pol', type: 'normal', path: "m/44'/60'/0'/0/i" },
    { symbol: 'pol', type: 'ledger', path: "m/44'/60'/i'/0/0" },
    { symbol: 'bsc', type: 'normal', path: "m/44'/60'/0'/0/i" },
    { symbol: 'bsc', type: 'ledger', path: "m/44'/60'/i'/0/0" },
    { symbol: 'arb', type: 'normal', path: "m/44'/60'/0'/0/i" },
    { symbol: 'arb', type: 'ledger', path: "m/44'/60'/i'/0/0" },
    { symbol: 'base', type: 'normal', path: "m/44'/60'/0'/0/i" },
    { symbol: 'base', type: 'ledger', path: "m/44'/60'/i'/0/0" },
    { symbol: 'op', type: 'normal', path: "m/44'/60'/0'/0/i" },
    { symbol: 'op', type: 'ledger', path: "m/44'/60'/i'/0/0" },
    { symbol: 'sol', type: 'normal', path: "m/44'/501'/i'/0'" },
    { symbol: 'sol', type: 'ledger', path: "m/44'/501'/i'" },
    { symbol: 'dsol', type: 'normal', path: "m/44'/501'/i'/0'" },
    { symbol: 'ada', type: 'normal', path: "m/1852'/1815'/i'" },
    { symbol: 'ada', type: 'legacy', path: "m/1852'/1815'/i'" },
    { symbol: 'ada', type: 'ledger', path: "m/1852'/1815'/i'" },
    { symbol: 'tada', type: 'normal', path: "m/1852'/1815'/i'" },
    { symbol: 'tada', type: 'legacy', path: "m/1852'/1815'/i'" },
    { symbol: 'tada', type: 'ledger', path: "m/1852'/1815'/i'" },
    { symbol: 'etc', type: 'normal', path: "m/44'/61'/0'/0/i" },
    { symbol: 'xrp', type: 'normal', path: "m/44'/144'/i'/0/0" },
    { symbol: 'txrp', type: 'normal', path: "m/44'/144'/i'/0/0" },
    { symbol: 'ltc', type: 'normal', path: "m/84'/2'/i'" },
    { symbol: 'ltc', type: 'segwit', path: "m/49'/2'/i'" },
    { symbol: 'ltc', type: 'legacy', path: "m/44'/2'/i'" },
    { symbol: 'bch', type: 'normal', path: "m/44'/145'/i'" },
    { symbol: 'doge', type: 'normal', path: "m/44'/3'/i'" },
    { symbol: 'zec', type: 'normal', path: "m/44'/133'/i'" },
] as const;

export const CARDANO_DERIVATIONS = {
    normal: PROTO.CardanoDerivationType.ICARUS,
    legacy: PROTO.CardanoDerivationType.ICARUS_TREZOR,
    ledger: PROTO.CardanoDerivationType.LEDGER,
} as const;

export type AccountTypeItem = (typeof ACCOUNT_TYPES)[number];

type DistributivePick<T, K extends keyof T> = T extends T ? Pick<T, K> : never;

export type AccountTypeKey = DistributivePick<AccountTypeItem, 'symbol' | 'type'>;

export type AdditionalParams = Pick<
    BlockchainLinkParams<'getAccountInfo'>,
    'details' | 'pageSize'
> & {
    identity?: string;
};

type TypedAccountParam = AccountTypeKey &
    AdditionalParams & {
        skip?: number;
    };

type UntypedAccountParam = AdditionalParams & {
    symbol: AccountTypeItem['symbol'];
    type?: undefined;
    skip?: undefined;
};

type DiscoverAccountsParams = {
    accounts: (TypedAccountParam | UntypedAccountParam)[];
};

export type DiscoverAccountsProgress = AccountTypeKey &
    ((AccountInfo & { path: string }) | { error: string }) & {
        index: number;
    };

type DiscoverAccountsResult = {
    empty: number;
    nonempty: number;
    failed: number;
};

export declare function discoverAccounts(
    params: Params<DiscoverAccountsParams>,
): Response<DiscoverAccountsResult>;
