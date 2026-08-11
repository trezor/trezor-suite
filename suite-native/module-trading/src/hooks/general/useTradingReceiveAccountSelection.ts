import { useDispatch } from 'react-redux';

import { type TradingType, tradingBuyActions, tradingExchangeActions } from '@suite-common/trading';
import { type ReceiveAccount } from '@suite-native/trading-types';

export const useTradingReceiveAccountSelection = (tradingType: Exclude<TradingType, 'sell'>) => {
    const dispatch = useDispatch();

    return (receiveAccount: ReceiveAccount) => {
        const { account, address } = receiveAccount;

        if (tradingType === 'buy') {
            dispatch(tradingBuyActions.setTradingAccountKey(account.key));
            dispatch(tradingBuyActions.setReceiveAccountKey(account.key));
            dispatch(tradingBuyActions.setReceiveAddress(address?.address));

            return;
        }

        dispatch(tradingExchangeActions.setReceiveAccountKey(account.key));
        dispatch(tradingExchangeActions.setReceiveAddress(address?.address));
    };
};
