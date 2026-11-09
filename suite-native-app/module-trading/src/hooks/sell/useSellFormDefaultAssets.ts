import { useSelector } from 'react-redux';

import { selectSellFormDefaultValues } from '@suite-native/trading-state';
import { type SellFormType } from '@suite-native/trading-types';

import { useSellSendAssetChange } from './useSellSendAssetChange';
import { resetSellForm } from '../../utils/sell/sellFormResetUtils';
import { useDefaultSendAssetPreselection } from '../general/form/useDefaultAssetPreselection';
import { useTradingFormResetRequest } from '../general/form/useTradingFormResetRequest';

export const useSellFormDefaultAssets = (form: SellFormType) => {
    const defaultValues = useSelector(selectSellFormDefaultValues);
    const { selectedAsset, changeAsset, clearAsset } = useSellSendAssetChange(form);

    const applyDefaultAsset = useDefaultSendAssetPreselection({
        tradingType: 'sell',
        selectedAsset,
        changeAsset,
        clearAsset,
    });

    useTradingFormResetRequest({
        tradeType: 'sell',
        resetForm: () => {
            resetSellForm(form, defaultValues);
            applyDefaultAsset();
        },
    });
};
