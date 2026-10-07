import { useSelector } from 'react-redux';

import { selectExchangeBuyTradeableAssets } from '@suite-native/trading-state';
import { type ExchangeFormType } from '@suite-native/trading-types';

import { useExchangeReceiveAssetChange } from './useExchangeReceiveAssetChange';
import { useExchangeSendAssetChange } from './useExchangeSendAssetChange';
import { resetExchangeForm } from '../../utils/exchange/exchangeFormResetUtils';
import {
    useDefaultReceiveAssetPreselection,
    useDefaultSendAssetPreselection,
} from '../general/form/useDefaultAssetPreselection';
import { useTradingFormResetRequest } from '../general/form/useTradingFormResetRequest';

export const useExchangeFormDefaultAssets = (form: ExchangeFormType) => {
    const tradeableReceiveAssets = useSelector(selectExchangeBuyTradeableAssets);
    const sendSide = useExchangeSendAssetChange(form);
    const receiveSide = useExchangeReceiveAssetChange(form);

    const applyDefaultSendAsset = useDefaultSendAssetPreselection({
        tradingType: 'exchange',
        selectedAsset: sendSide.selectedAsset,
        changeAsset: sendSide.changeAsset,
        clearAsset: sendSide.clearAsset,
    });
    const applyDefaultReceiveAsset = useDefaultReceiveAssetPreselection({
        tradingType: 'exchange',
        tradeableAssets: tradeableReceiveAssets,
        selectedAsset: receiveSide.selectedAsset,
        changeAsset: receiveSide.changeAsset,
        clearAsset: receiveSide.clearAsset,
    });

    useTradingFormResetRequest({
        tradeType: 'exchange',
        resetForm: () => {
            resetExchangeForm(form);
            applyDefaultSendAsset();
            applyDefaultReceiveAsset();
        },
    });
};
