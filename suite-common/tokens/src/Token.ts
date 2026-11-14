import type { TokenInfo } from '@trezor/blockchain-link-types';
import type { Branded } from '@trezor/type-utils';

export type TokenSymbol = string & Branded<'TokenSymbol'>;
export const toTokenSymbol = (value: string) => value as TokenSymbol;

/**
 * Identifies a non-native token within a network by its contract, mint, or equivalent asset identifier.
 * Its full identity combines NetworkSymbol and TokenAddress; the address alone is not globally unique.
 *
 * @see https://github.com/trezor/trezor-suite/blob/develop/docs/ubiquitous-language.md
 */
export type TokenAddress = string & Branded<'TokenAddress'>;
export const toTokenAddress = (value: string) => value as TokenAddress;

/**
 * A non-native asset issued on a network, such as USDC on Ethereum, with branded symbol and address.
 * Identify it by its network and TokenAddress; its ticker alone is insufficient.
 *
 * @see https://github.com/trezor/trezor-suite/blob/develop/docs/ubiquitous-language.md
 */
export type TokenInfoBranded = TokenInfo & {
    symbol: TokenSymbol;
    contract: TokenAddress;
};
