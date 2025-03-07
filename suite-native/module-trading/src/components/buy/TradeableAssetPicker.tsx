import { BuyTradeableAssetsSheet } from './BuyTradeableAssetsSheet';
import { useTradeSheetControls } from '../../hooks/useTradeSheetControls';
import { TradeableAsset } from '../../types';
import { SelectTradeableAssetButton } from '../general/SelectTradeableAssetButton';

type TradeableAssetPickerProps = ReturnType<typeof useTradeSheetControls<TradeableAsset>>;

export const TradeableAssetPicker = ({
    isSheetVisible,
    showSheet,
    hideSheet,
    selectedValue,
    setSelectedValue,
}: TradeableAssetPickerProps) => (
    <>
        <SelectTradeableAssetButton onPress={showSheet} selectedAsset={selectedValue} />
        <BuyTradeableAssetsSheet
            isVisible={isSheetVisible}
            onClose={hideSheet}
            onAssetSelect={setSelectedValue}
        />
    </>
);
