import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { LegalSheet } from './LegalSheet';
import { useTradeConfirmationControls } from '../../hooks/useTradeConfirmationControls';

export const Confirmation = () => {
    const { isConfirmationEnabled, showSheet, hideSheet, isSheetVisible, tradeProviderName } =
        useTradeConfirmationControls();

    return (
        <>
            <Button onPress={showSheet} disabled={!isConfirmationEnabled}>
                <Translation id="moduleTrading.tradingScreen.continueButton" />
            </Button>
            <LegalSheet
                onClose={hideSheet}
                isVisible={isSheetVisible}
                tradeProviderName={tradeProviderName}
            />
        </>
    );
};
