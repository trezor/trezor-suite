import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import {
    canSwitchExchangeAssets,
    getUnusedAddressFromAccount,
    selectTradingExchangeBuyCryptoIds,
    selectTradingExchangeSellCryptoIds,
} from '@suite-common/trading';
import { selectDeviceEnabledDiscoveryNetworkSymbols } from '@suite-native/discovery';
import { useWatch } from '@suite-native/forms';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { tradingActions } from '@suite-native/trading-state';
import { type ExchangeFormType } from '@suite-native/trading-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useExchangeReceiveAssetChange } from './useExchangeReceiveAssetChange';
import { useExchangeSendAssetChange } from './useExchangeSendAssetChange';
import { setExchangeSendCryptoAmount } from '../../utils/exchange/exchangeSendAmountUtils';

export const useExchangeAssetsSwitch = (form: ExchangeFormType) => {
    const { dispatch } = useServices(injectDispatch);
    const sellCryptoIds = useSelector(selectTradingExchangeSellCryptoIds);
    const buyCryptoIds = useSelector(selectTradingExchangeBuyCryptoIds);
    const enabledNetworkSymbols = useSelector(selectDeviceEnabledDiscoveryNetworkSymbols);

    const [sendAsset, sendAccount, receiveAsset, receiveAccount, receiveCryptoAmount] = useWatch({
        control: form.control,
        name: ['sendAsset', 'sendAccount', 'receiveAsset', 'receiveAccount', 'receiveCryptoAmount'],
    });
    const { changeAsset: changeSendAsset, clearAsset: clearSendAsset } =
        useExchangeSendAssetChange(form);
    const { changeAsset: changeReceiveAsset } = useExchangeReceiveAssetChange(form);

    const receiveNetworkSymbol = getSymbolFromTradeableAsset(receiveAsset);
    const isReceiveNetworkEnabled =
        !!receiveNetworkSymbol && enabledNetworkSymbols.includes(receiveNetworkSymbol);
    const canSwitch =
        canSwitchExchangeAssets({
            sendCryptoId: sendAsset?.cryptoId,
            receiveCryptoId: receiveAsset?.cryptoId,
            sellCryptoIds,
            buyCryptoIds,
        }) &&
        (!isReceiveNetworkEnabled || !!receiveAccount);

    const switchAssets = useCallback(() => {
        if (!sendAsset || !sendAccount || !receiveAsset) {
            return;
        }

        const payAmount = receiveCryptoAmount ?? form.getValues('sendCryptoAmount');
        const { address } = getUnusedAddressFromAccount(sendAccount);

        changeReceiveAsset(sendAsset);
        dispatch(
            tradingActions.setReceiveAccount({
                tradingType: 'exchange',
                accountKey: sendAccount.key,
                address,
            }),
        );

        if (!receiveAccount) {
            clearSendAsset();

            return;
        }

        changeSendAsset(receiveAsset, receiveAccount.account, { shouldReportAnalytics: false });
        setExchangeSendCryptoAmount(form.setValue, payAmount);
    }, [
        form,
        dispatch,
        sendAsset,
        sendAccount,
        receiveAsset,
        receiveAccount,
        receiveCryptoAmount,
        changeReceiveAsset,
        changeSendAsset,
        clearSendAsset,
    ]);

    return { canSwitch, isReceiveNetworkEnabled, switchAssets };
};
