import { type SellFormType } from '@suite-native/trading-types';

import { useSellSendAssetChange } from './useSellSendAssetChange';
import { useDefaultSendAssetPreselection } from '../general/form/useDefaultAssetPreselection';

export const useSellFormDefaultAssets = (form: SellFormType) => {
    const { selectedAsset, changeAsset } = useSellSendAssetChange(form);

    useDefaultSendAssetPreselection({ tradingType: 'sell', selectedAsset, changeAsset });
};
