import { useCallback, useEffect, useMemo } from 'react';

import { CryptoId } from 'invity-api';

import { TradingType } from '@suite-common/suite-types';
import { selectTokenDefinitions } from '@suite-common/token-definitions';
import {
    CONTRACT_ADDRESS_FOR_NATIVE_TOKEN,
    parseCryptoId,
    selectTradingAccountKeyByTradeType,
    selectTradingPrefilledFromAccount,
    toTokenCryptoId,
    tradingActions,
    tradingBuyActions,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import { selectAccountByKey, selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { getTokens } from 'src/utils/wallet/tokenUtils';

/*
 * Selects the most suitable account and cryptoId for trading forms based on the trade type.
 *
 * Eligibility rule: Account must have a positive balance of network's native token or any other (not hidden) token
 *
 * Selection priority:
 * 1) Preferred account (resolved from selected trading account key OR prefilled.key) if eligible.
 * 2) First account with the same symbol as the preferred account that is eligible.
 * 3) Fallbacks:
 *    a) BTC account (eligible per rule above),
 *    b) any eligible account,
 *    c) otherwise the first available account (last resort).
 *
 * cryptoId resolution:
 * 1) Use prefilled.cryptoId when present and account for given cryptoId is eligible.
 * 2) Otherwise derive from the selected account's network (getNetwork(symbol).tradeCryptoId).
 * 3) Fallback to 'bitcoin' if unavailable.
 */
export const useTradingFormAccount = (tradingType: TradingType) => {
    const dispatch = useDispatch();
    const visibileDeviceAccounts = useSelector(selectVisibleDeviceAccounts);
    const tokenDefinitions = useSelector(selectTokenDefinitions);

    const prefilled = useSelector(selectTradingPrefilledFromAccount);
    const accountKey = useSelector(state => selectTradingAccountKeyByTradeType(state, tradingType));

    const preferredKey = accountKey ?? prefilled.key;
    const preferredAccount = useSelector(state => selectAccountByKey(state, preferredKey));

    const isAccountEligibleForTrade = useCallback(
        (account: Account, cryptoId?: CryptoId) => {
            if (tradingType === 'buy') return true;

            const { contractAddress } = cryptoId ? parseCryptoId(cryptoId) : {};
            const isNativeToken =
                !contractAddress || contractAddress === CONTRACT_ADDRESS_FOR_NATIVE_TOKEN;

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

            return tokens?.shownWithBalance.some(token => {
                const id = toTokenCryptoId(
                    account.symbol,
                    getContractAddressForNetworkSymbol(account.symbol, token.contract),
                );

                return id === cryptoId && new BigNumber(token.balance ?? '0').gt(0);
            });
        },
        [tokenDefinitions, tradingType],
    );

    const pickFallbackAccount = useCallback(
        (accounts: Account[]) =>
            accounts.find(acc => isAccountEligibleForTrade(acc)) ?? accounts[0],
        [isAccountEligibleForTrade],
    );

    const account = useMemo(() => {
        if (preferredAccount && isAccountEligibleForTrade(preferredAccount, prefilled.cryptoId)) {
            return preferredAccount;
        }

        const sameSymbolAccount = visibileDeviceAccounts.find(
            acc =>
                acc.symbol === preferredAccount?.symbol &&
                isAccountEligibleForTrade(acc, prefilled.cryptoId),
        );

        if (sameSymbolAccount) {
            return sameSymbolAccount;
        }

        return pickFallbackAccount(visibileDeviceAccounts);
    }, [
        visibileDeviceAccounts,
        isAccountEligibleForTrade,
        pickFallbackAccount,
        preferredAccount,
        prefilled.cryptoId,
    ]);

    const cryptoId = useMemo(() => {
        if (prefilled.cryptoId && account.key === preferredAccount?.key) {
            return prefilled.cryptoId;
        }

        return (getNetwork(account.symbol).tradeCryptoId ?? 'bitcoin') as CryptoId;
    }, [prefilled.cryptoId, account.key, account.symbol, preferredAccount?.key]);

    useEffect(() => {
        if (!accountKey && account.key) {
            switch (tradingType) {
                case 'exchange':
                    dispatch(tradingExchangeActions.setTradingAccountKey(account.key));
                    break;
                case 'sell':
                    dispatch(tradingSellActions.setTradingAccountKey(account.key));
                    break;
                case 'buy':
                    dispatch(tradingBuyActions.setTradingAccountKey(account.key));
                    break;
            }
        }
    }, [account.key, accountKey, dispatch, tradingType]);

    useEffect(() => {
        if (prefilled.key && accountKey) {
            dispatch(
                tradingActions.setTradingFromPrefilledAccount({
                    key: undefined,
                    cryptoId: prefilled.cryptoId,
                }),
            );
        }
    }, [accountKey, dispatch, prefilled.key, prefilled.cryptoId]);

    return {
        tradingAccountKey: account.key,
        account,
        cryptoId,
    };
};
