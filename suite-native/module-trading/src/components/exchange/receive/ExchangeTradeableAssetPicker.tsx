import { HStack } from '@suite-native/atoms';

import { ExchangeReceiveAmountInput } from './ExchangeReceiveAmountInput';
import { ExchangeTradeableAssetsSheet } from './ExchangeTradeableAssetsSheet';
import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { useSheetControls } from '../../../hooks/general/useSheetControls';
import { SelectTradeableAssetButton } from '../../general/SelectTradeableAssetButton';

const ASSET_PICKER_TEST_ID = '@trading/exchange/asset-receive-button';

export const ExchangeTradeableAssetPicker = () => {
    const form = useExchangeFormContext();
    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useSheetControls(form, 'receiveAsset');

    return (
        <>
            <HStack justifyContent="space-between" alignItems="center">
                <SelectTradeableAssetButton
                    onPress={showSheet}
                    selectedAsset={selectedValue}
                    buttonColorProps={{ intent: 'neutral', priority: 'secondary' }}
                    caret
                    testID={ASSET_PICKER_TEST_ID}
                />
                <ExchangeReceiveAmountInput showAssetsSheet={showSheet} />
            </HStack>
            <ExchangeTradeableAssetsSheet
                onAssetSelect={setSelectedValue}
                onClose={hideSheet}
                isVisible={isSheetVisible}
            />
        </>
    );
};
