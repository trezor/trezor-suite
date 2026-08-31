import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { useSelector } from '@suite-common/redux-utils';
import {
    type TradingType,
    selectTradingAccountKeyByTradeType,
    selectTradingFormAccount,
    selectTradingFormCryptoId,
    selectTradingPrefilledFromAccount,
    tradingActions,
    tradingBuyActions,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';
export const useTradingFormAccount = (tradingType: TradingType) => {
    const dispatch = useDispatch();

    const account = useSelector(state => selectTradingFormAccount(state, tradingType));
    const cryptoId = useSelector(state => selectTradingFormCryptoId(state, tradingType));
    const accountKey = useSelector(state => selectTradingAccountKeyByTradeType(state, tradingType));
    const prefilled = useSelector(selectTradingPrefilledFromAccount);

    // TODO(#29479): these two chained effects sync the resolved account into redux and then
    // clear the prefill; they will be removed once the account key is set directly from the
    // picker handlers (split empty-vs-full-form).
    useEffect(() => {
        if (!accountKey && account?.key) {
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
    }, [account?.key, accountKey, dispatch, tradingType]);

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
        tradingAccountKey: account?.key,
        account,
        cryptoId,
    };
};
