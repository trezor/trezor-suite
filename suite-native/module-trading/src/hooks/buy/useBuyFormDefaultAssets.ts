import { useSelector } from 'react-redux';

import { selectBuyTradeableAssets } from '@suite-native/trading-state';
import { type BuyFormType } from '@suite-native/trading-types';

import { useBuyAssetChange } from './useBuyAssetChange';
import { useDefaultReceiveAssetPreselection } from '../general/form/useDefaultAssetPreselection';

export const useBuyFormDefaultAssets = (form: BuyFormType) => {
    const tradeableAssets = useSelector(selectBuyTradeableAssets);
    const { selectedAsset, changeAsset } = useBuyAssetChange(form);

    useDefaultReceiveAssetPreselection({
        tradingType: 'buy',
        tradeableAssets,
        selectedAsset,
        changeAsset,
    });
};
