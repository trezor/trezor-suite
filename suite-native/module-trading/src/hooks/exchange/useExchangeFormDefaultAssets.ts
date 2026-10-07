import { useSelector } from 'react-redux';

import { selectExchangeBuyTradeableAssets } from '@suite-native/trading-state';
import { type ExchangeFormType } from '@suite-native/trading-types';

import { useExchangeReceiveAssetChange } from './useExchangeReceiveAssetChange';
import { useExchangeSendAssetChange } from './useExchangeSendAssetChange';
import {
    useDefaultReceiveAssetPreselection,
    useDefaultSendAssetPreselection,
} from '../general/form/useDefaultAssetPreselection';

export const useExchangeFormDefaultAssets = (form: ExchangeFormType) => {
    const tradeableReceiveAssets = useSelector(selectExchangeBuyTradeableAssets);
    const sendSide = useExchangeSendAssetChange(form);
    const receiveSide = useExchangeReceiveAssetChange(form);

    useDefaultSendAssetPreselection({
        tradingType: 'exchange',
        selectedAsset: sendSide.selectedAsset,
        changeAsset: sendSide.changeAsset,
    });
    useDefaultReceiveAssetPreselection({
        tradingType: 'exchange',
        tradeableAssets: tradeableReceiveAssets,
        selectedAsset: receiveSide.selectedAsset,
        changeAsset: receiveSide.changeAsset,
    });
};
