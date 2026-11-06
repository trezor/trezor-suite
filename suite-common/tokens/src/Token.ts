import type { TokenInfo } from '@trezor/blockchain-link-types';
import type { Branded } from '@trezor/type-utils';

export type TokenSymbol = string & Branded<'TokenSymbol'>;
export const toTokenSymbol = (value: string) => value as TokenSymbol;

export type TokenAddress = string & Branded<'TokenAddress'>;
export const toTokenAddress = (value: string) => value as TokenAddress;

export type TokenInfoBranded = TokenInfo & {
    symbol: TokenSymbol;
    contract: TokenAddress;
};
