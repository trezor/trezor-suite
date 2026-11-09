import { useSelector } from 'react-redux';

import { HStack } from '@suite-native/atoms';
import { selectExchangeBuyTradeableAssets } from '@suite-native/trading-state';

import { ExchangeReceiveAmountInput } from './ExchangeReceiveAmountInput';
import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { useExchangeReceiveAssetChange } from '../../../hooks/exchange/useExchangeReceiveAssetChange';
import { useTradeableAssetPickerNavigation } from '../../../hooks/general/useTradeableAssetPickerNavigation';
import { TradeableAssetButton } from '../../general/TradeableAssetButton';

const ASSET_PICKER_TEST_ID = '@trading/exchange/asset-receive-button';

export const ExchangeTradeableAssetPicker = () => {
    const form = useExchangeFormContext();
    const assets = useSelector(selectExchangeBuyTradeableAssets);
    const { selectedAsset: selectedValue, changeAsset: handleAssetSelect } =
        useExchangeReceiveAssetChange(form);

    const showAssetsScreen = useTradeableAssetPickerNavigation({
        assets,
        onAssetSelect: handleAssetSelect,
        tradingType: 'exchange',
    });

    return (
        <HStack justifyContent="space-between" alignItems="center">
            <ExchangeReceiveAmountInput />
            <TradeableAssetButton
                onPress={showAssetsScreen}
                selectedAsset={selectedValue}
                caret
                testID={ASSET_PICKER_TEST_ID}
            />
        </HStack>
    );
};
