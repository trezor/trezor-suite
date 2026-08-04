import { type CryptoId } from 'invity-api';

import { type TokenDefinitionsState } from '@suite-common/token-definitions';
import type { NetworkConfigDeps } from '@suite-common/wallet-config';
import { getTokens } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { CONTRACT_ADDRESS_FOR_NATIVE_TOKEN } from '../constants';
import { type TradingType } from '../types';
import { parseCryptoId, toTokenCryptoId } from '../utils';

export const isAccountEligibleForTrade = (
    deps: NetworkConfigDeps,
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
                  ...deps,
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
                deps,
                account.symbol,
                getContractAddressForNetworkSymbol(deps, account.symbol, token.contract),
            );

            return id === cryptoId && new BigNumber(token.balance ?? '0').gt(0);
        }) ?? false
    );
};
