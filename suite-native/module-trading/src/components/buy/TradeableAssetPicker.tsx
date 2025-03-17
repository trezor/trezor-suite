import { BuyTradeableAssetsSheet } from './BuyTradeableAssetsSheet';
import { useTradeSheetControls } from '../../hooks/useTradeSheetControls';
import { TradingBuyForm } from '../../types';
import { SelectTradeableAssetButton } from '../general/SelectTradeableAssetButton';

type TradeableAssetPickerProps = {
    form: TradingBuyForm;
};

export const TradeableAssetPicker = ({ form }: TradeableAssetPickerProps) => {
    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useTradeSheetControls(form, 'asset');

    return (
        <>
            <SelectTradeableAssetButton onPress={showSheet} selectedAsset={selectedValue} />
            <BuyTradeableAssetsSheet
                isVisible={isSheetVisible}
                onClose={hideSheet}
                onAssetSelect={setSelectedValue}
            />
        </>
    );
};
