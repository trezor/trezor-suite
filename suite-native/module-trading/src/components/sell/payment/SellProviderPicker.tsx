import { useSelector } from 'react-redux';

import type { SellFiatTrade } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import {
    type TradingRootState as TradingRootStateCommon,
    selectTradingProviderByNameAndTradeType,
    selectTradingSellIsLoading,
    selectTradingSellProviders,
} from '@suite-common/trading';
import { events } from '@suite-native/analytics';
import { HStack, Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';
import { OverviewRow, OverviewValueSkeleton, ProviderLogo } from '@suite-native/trading-atoms';
import { ResidenceCheckAwareAnimatedBox } from '@suite-native/trading-residence';
import {
    type TradingRootState,
    selectSellQuotesByPaymentMethod,
} from '@suite-native/trading-state';

import { useSheetControls } from '../../../hooks/general/useSheetControls';
import { useSellFormContext } from '../../../hooks/sell/useSellFormContext';
import { ProviderSheet } from '../../general/ProviderSheet/ProviderSheet';

const PROVIDER_PICKER_TEST_ID = '@trading/sell/provider-picker';

type SellProviderPickerRightProps = {
    isLoading: boolean;
    selectedValue: SellFiatTrade | undefined;
};

const SellProviderPickerRight = ({ isLoading, selectedValue }: SellProviderPickerRightProps) => {
    const { translate } = useTranslate();
    const { exchange } = selectedValue ?? {};

    const provider = useSelector((state: TradingRootStateCommon) =>
        selectTradingProviderByNameAndTradeType(state, exchange, 'sell'),
    );

    if (isLoading) {
        return <OverviewValueSkeleton />;
    }

    invariant(provider, 'Selected provider should be defined');
    const { companyName, logo } = provider;

    return (
        <HStack>
            <ProviderLogo logo={logo} />
            <Text
                color="contentSecondary"
                variant="body-sm"
                accessibilityLabel={translate('moduleTrading.tradingScreen.selectedProvider')}
                testID={PROVIDER_PICKER_TEST_ID + '/value'}
            >
                {companyName}
            </Text>
        </HStack>
    );
};

export const SellProviderPicker = () => {
    const { translate } = useTranslate();
    const analytics = useAnalytics();
    const form = useSellFormContext();
    const providers = useSelector(selectTradingSellProviders);
    const isLoading = useSelector(selectTradingSellIsLoading);
    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useSheetControls(form, 'quote');

    const { paymentMethod } = selectedValue ?? {};
    const quotes = useSelector((state: TradingRootState) =>
        selectSellQuotesByPaymentMethod(state, paymentMethod),
    );

    const shouldShowPicker = (providers && Object.values(quotes).flat().length > 0) || isLoading;

    if (!shouldShowPicker) {
        return null;
    }

    const handleProviderPress = () => {
        if (isLoading) return;

        showSheet();
        analytics.report({
            type: events.tradingCompareOffersEvent.name,
            payload: {
                type: 'sell',
            },
        });
    };

    const handleQuoteSelect = (quote: SellFiatTrade) => {
        setSelectedValue(quote);

        if (selectedValue?.exchange === quote.exchange) return;

        analytics.report({
            type: events.tradingParameterChangedEvent.name,
            payload: {
                type: 'sell',
                parameter: 'provider',
            },
        });
    };

    return (
        <>
            <ResidenceCheckAwareAnimatedBox>
                <OverviewRow
                    title={translate('moduleTrading.tradingScreen.provider')}
                    onPress={handleProviderPress}
                    noCaret={isLoading}
                    testID={PROVIDER_PICKER_TEST_ID}
                    warning={
                        isLoading ? undefined : translate('moduleTrading.tradingScreen.kycWarning')
                    }
                    noBottomBorder
                >
                    <SellProviderPickerRight isLoading={isLoading} selectedValue={selectedValue} />
                </OverviewRow>
            </ResidenceCheckAwareAnimatedBox>
            <ProviderSheet
                quotes={quotes}
                isVisible={isSheetVisible}
                onClose={hideSheet}
                onQuoteSelect={handleQuoteSelect}
                selectedQuote={selectedValue}
                tradingType="sell"
            />
        </>
    );
};
