import { useTradeSheetControls } from '../../hooks/useTradeSheetControls';
import { TradeableAsset } from '../../types';
import { SelectTradeableAssetButton } from '../general/SelectTradeableAssetButton';
import { TradeableAssetsSheet } from '../general/TradeableAssetsSheet/TradeableAssetsSheet';

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
        <TradeableAssetsSheet
            isVisible={isSheetVisible}
            onClose={hideSheet}
            onAssetSelect={setSelectedValue}
        />
    </>
);
