import { type TradingType } from '@suite-common/trading';
import { tradingActions } from '@suite-native/trading-state';
import { type ReceiveAccount } from '@suite-native/trading-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

export const useTradingReceiveAccountSelection = (tradingType: Exclude<TradingType, 'sell'>) => {
    const { dispatch } = useServices(injectDispatch);

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
