import { useDispatch } from '@suite-common/redux-utils';
import { type TradingType } from '@suite-common/trading';
import { tradingActions } from '@suite-native/trading-state';
import { type ReceiveAccount } from '@suite-native/trading-types';

export const useTradingReceiveAccountSelection = (tradingType: Exclude<TradingType, 'sell'>) => {
    const dispatch = useDispatch();

    return (receiveAccount: ReceiveAccount) => {
        const { account, address } = receiveAccount;

        dispatch(
            tradingActions.setReceiveAccount({
                tradingType,
                accountKey: account.key,
                address: address?.address,
            }),
        );
    };
};
