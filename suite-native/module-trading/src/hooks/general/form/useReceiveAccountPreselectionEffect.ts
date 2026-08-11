import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type TradingType, getReceiveAccountPreselection } from '@suite-common/trading';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import {
    type CombinedSelectorsRootState,
    selectVisibleDeviceAccountsByNetworkSymbolSorted,
    tradingActions,
} from '@suite-native/trading-state';
import {
    type ReceiveAccount,
    type TradeableAsset,
    type TradingRootState,
} from '@suite-native/trading-types';

type ReceiveAccountSelector = (
    state: TradingRootState & AccountsRootState,
) => ReceiveAccount | undefined;

type SendAccountSelector = (state: TradingRootState & AccountsRootState) => Account | undefined;

type UseReceiveAccountPreselectionEffectProps = {
    receiveAsset?: TradeableAsset;
    tradingType: Exclude<TradingType, 'sell'>;
    selectReceiveAccount: ReceiveAccountSelector;
    selectSendAccount?: SendAccountSelector;
};

export const useReceiveAccountPreselectionEffect = ({
    tradingType,
    receiveAsset,
    selectReceiveAccount,
    selectSendAccount,
}: UseReceiveAccountPreselectionEffectProps) => {
    const dispatch = useDispatch();

    const receiveAssetNetworkSymbol = getSymbolFromTradeableAsset(receiveAsset);

    const accounts = useSelector((state: CombinedSelectorsRootState) =>
        selectVisibleDeviceAccountsByNetworkSymbolSorted(state, receiveAssetNetworkSymbol ?? null),
    );
    const selectedReceiveAccount = useSelector(selectReceiveAccount);
    const selectedSendAccount = useSelector((state: TradingRootState & AccountsRootState) =>
        selectSendAccount?.(state),
    );

    useEffect(() => {
        if (!receiveAssetNetworkSymbol || accounts.length === 0 || !!selectedReceiveAccount) {
            return;
        }

        const preselectedAccount = getReceiveAccountPreselection({
            receiveAssetNetworkSymbol,
            accounts,
            sendAccount: selectedSendAccount,
        });

        if (!preselectedAccount) {
            return;
        }

        const { accountKey, address } = preselectedAccount;

        dispatch(tradingActions.setReceiveAccount({ tradingType, accountKey, address }));
    }, [
        accounts,
        dispatch,
        receiveAssetNetworkSymbol,
        selectedReceiveAccount,
        tradingType,
        selectedSendAccount,
    ]);
};
