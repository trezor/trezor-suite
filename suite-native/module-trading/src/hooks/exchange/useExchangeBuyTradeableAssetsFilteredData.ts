import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectAddressValidatorDep } from '@suite-common/address';
import { useServices } from '@suite-common/dependency-injection';
import type { FeatureFlagsRootState } from '@suite-native/feature-flags';
import {
    type TradingRootState,
    selectExchangeBuyTradeableAssets,
} from '@suite-native/trading-state';

import { useExchangeFormContext } from './useExchangeFormContext';
import { useTradeableAssetsFilteredData } from '../general/useTradeableAssetsFilteredData';

export const useExchangeBuyTradeableAssetsFilteredData = () => {
    const { addressValidator } = useServices(selectAddressValidatorDep);
    const { watch } = useExchangeFormContext();
    const sendAsset = watch('sendAsset');
    const supportedCoins = useMemo(() => addressValidator.getSupportedCoins(), [addressValidator]);
    const assets = useSelector((state: TradingRootState & FeatureFlagsRootState) =>
        selectExchangeBuyTradeableAssets(state, supportedCoins, sendAsset?.cryptoId),
    );

    return useTradeableAssetsFilteredData({ assets });
};
