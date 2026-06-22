import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    selectTradingExchangeSelectedQuoteIsDex,
    selectTradingExchangeSelectedQuoteSwapSlippage,
} from '@suite-common/trading';
import { HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation, selectLocale } from '@suite-native/intl';
import { TradeInfoRow, useBottomSheetControls } from '@suite-native/trading-atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { SlippageBottomSheet } from './SlippageBottomSheet';

export const SLIPPAGE_PICKER_TEST_ID = '@trading/exchange/slippage-picker';

const slippagePickerStyle = prepareNativeStyle(({ spacings }) => ({
    height: spacings.sp56,
}));

export const SlippagePicker = () => {
    const { isSheetVisible, showSheet, hideSheet } = useBottomSheetControls();
    const isDex = useSelector(selectTradingExchangeSelectedQuoteIsDex);
    const swapSlippage = useSelector(selectTradingExchangeSelectedQuoteSwapSlippage);
    const locale = useSelector(selectLocale);
    const { applyStyle } = useNativeStyles();

    const percentFormatter = useMemo(
        () =>
            new Intl.NumberFormat(locale, {
                style: 'percent',
                maximumFractionDigits: 2,
            }),
        [locale],
    );

    if (!isDex || !swapSlippage) {
        return null;
    }

    const percent = percentFormatter.format(Number(swapSlippage) / 100);

    return (
        <>
            <TradeInfoRow
                onPress={showSheet}
                testID={SLIPPAGE_PICKER_TEST_ID}
                style={applyStyle(slippagePickerStyle)}
            >
                <Text variant="body-sm" color="contentSecondary">
                    <Translation id="moduleTrading.slippage.maxSlippageLabel" />
                </Text>
                <HStack alignItems="center" spacing="sp4">
                    <Text variant="body-sm" color="contentPrimary">
                        {percent}
                    </Text>
                    <Icon name="caretDown" size="medium" color="contentSecondary" />
                </HStack>
            </TradeInfoRow>
            <SlippageBottomSheet isVisible={isSheetVisible} onClose={hideSheet} />
        </>
    );
};
