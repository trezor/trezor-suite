import { useBottomSheetControls } from './useBottomSheetControls';

export const useTradeConfirmationControls = () => {
    const bottomSheetControls = useBottomSheetControls();

    // TODO use real value
    const tradeProviderName = 'Anycoin';
    // TODO real logic
    const isConfirmationEnabled = true;

    return {
        tradeProviderName,
        isConfirmationEnabled,
        ...bottomSheetControls,
    };
};
