import type { ExchangeTrade } from 'invity-api';

import { HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { TradeInfoRow, useBottomSheetControls } from '@suite-native/trading-atoms';

import { SlippageBottomSheet } from './SlippageBottomSheet';

export const SLIPPAGE_PICKER_TEST_ID = '@trading/exchange/slippage-picker';

type SlippagePickerProps = {
    quote: ExchangeTrade | undefined;
};

export const SlippagePicker = ({ quote }: SlippagePickerProps) => {
    const { isSheetVisible, showSheet, hideSheet } = useBottomSheetControls();

    if (!quote?.isDex) {
        return null;
    }

    return (
        <>
            <TradeInfoRow onPress={showSheet} testID={SLIPPAGE_PICKER_TEST_ID}>
                <Text variant="body-sm" color="contentSecondary">
                    <Translation id="moduleTrading.advancedSettings.slippage.maxSlippageLabel" />
                </Text>
                <HStack alignItems="center" spacing="sp4">
                    <Text variant="body-sm" color="contentPrimary">
                        {quote.swapSlippage}%
                    </Text>
                    <Icon name="caretDown" size="medium" color="contentSecondary" />
                </HStack>
            </TradeInfoRow>
            <SlippageBottomSheet isVisible={isSheetVisible} onClose={hideSheet} quote={quote} />
        </>
    );
};
