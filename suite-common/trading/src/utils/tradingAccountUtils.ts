import { type CryptoId } from 'invity-api';

import { type TokenDefinitionsState } from '@suite-common/token-definitions';
import { getTokens } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { CONTRACT_ADDRESS_FOR_NATIVE_TOKEN } from '../constants';
import { type TradingType } from '../types';
import { parseCryptoId, toTokenCryptoId } from '../utils';

export const isAccountEligibleForTrade = (
    account: Account,
    tradingType: TradingType,
    tokenDefinitions: TokenDefinitionsState,
    cryptoId?: CryptoId,
) => {
    if (tradingType === 'buy') return true;

    const contractAddress = cryptoId ? parseCryptoId(cryptoId).contractAddress : null;
    const isNativeToken = !contractAddress || contractAddress === CONTRACT_ADDRESS_FOR_NATIVE_TOKEN;

    const tokens =
        account.tokens && (account.tokens ?? []).length > 0
            ? getTokens({
                  tokens: account.tokens,
                  symbol: account.symbol,
                  tokenDefinitions: tokenDefinitions[account.symbol]?.coin,
              })
            : undefined;

    if (isNativeToken) {
        const hasTokensWithBalance = tokens ? tokens.shownWithBalance.length > 0 : false;
        const hasAccountBalance = new BigNumber(account.balance).gt(0);

        return hasTokensWithBalance || hasAccountBalance;
    }

    return (
        tokens?.shownWithBalance.some(token => {
            const id = toTokenCryptoId(
                account.symbol,
                getContractAddressForNetworkSymbol(account.symbol, token.contract),
            );

            return id === cryptoId && new BigNumber(token.balance ?? '0').gt(0);
        }) ?? false
    );
};

// Standalone so #29479 can drop the fallback and its lying non-null type in a single commit.
export const pickFallbackAccount = (
    accounts: Account[],
    tradingType: TradingType,
    tokenDefinitions: TokenDefinitionsState,
) => {
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const first: Account = accounts[0];

    return (
        accounts.find(account =>
            isAccountEligibleForTrade(account, tradingType, tokenDefinitions),
        ) ?? first
    );
};
