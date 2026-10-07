import { useSelector } from 'react-redux';

import { selectBuyFormDefaultValues, selectBuyTradeableAssets } from '@suite-native/trading-state';
import { type BuyFormType } from '@suite-native/trading-types';

import { useBuyReceiveAssetChange } from './useBuyReceiveAssetChange';
import { resetBuyForm } from '../../utils/buy/buyFormResetUtils';
import { useDefaultReceiveAssetPreselection } from '../general/form/useDefaultAssetPreselection';
import { useTradingFormResetRequest } from '../general/form/useTradingFormResetRequest';

export const useBuyFormDefaultAssets = (form: BuyFormType) => {
    const defaultValues = useSelector(selectBuyFormDefaultValues);
    const tradeableAssets = useSelector(selectBuyTradeableAssets);
    const { selectedAsset, changeAsset, clearAsset } = useBuyReceiveAssetChange(form);

    const applyDefaultAsset = useDefaultReceiveAssetPreselection({
        tradingType: 'buy',
        tradeableAssets,
        selectedAsset,
        changeAsset,
        clearAsset,
    });

    useTradingFormResetRequest({
        tradeType: 'buy',
        resetForm: () => {
            resetBuyForm(form, defaultValues);
            applyDefaultAsset();
        },
    });
};
