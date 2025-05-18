import { useSelector } from 'react-redux';

import { BuyTrade } from 'invity-api';

import {
    TradingRootState,
    selectBuyQuotesByPaymentMethod,
    selectTradingBuyIsLoading,
    selectTradingBuyProviders,
} from '@suite-common/trading';
import { EventType, analytics } from '@suite-native/analytics';
import { HStack, Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { useSheetControls } from '../../hooks/general/useSheetControls';
import { OverviewRow } from '../general/OverviewRow';
import { OverviewValueSkeleton } from '../general/OverviewValueSkeleton';
import { ProviderLogo } from '../general/ProviderLogo';
import { ProviderSheet } from '../general/ProviderSheet/ProviderSheet';

const PROVIDER_PICKER_TEST_ID = '@trading/buy/provider-picker';

export const BuyProviderPicker = () => {
    const { translate } = useTranslate();
    const form = useBuyFormContext();
    const providers = useSelector(selectTradingBuyProviders);
    const isLoading = useSelector(selectTradingBuyIsLoading);

    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useSheetControls(form, 'quote');
    const { paymentMethod, exchange: providerKey } = selectedValue ?? {};
    const quotes =
        useSelector((state: TradingRootState) =>
            selectBuyQuotesByPaymentMethod(state, paymentMethod),
        ) ?? [];

    const handleProviderPress = () => {
        analytics.report({
            type: EventType.TradingCompareOffers,
            payload: {
                type: 'buy',
            },
        });
        showSheet();
    };

    const handleQuoteSelect = (quote: BuyTrade) => {
        setSelectedValue(quote);

        if (selectedValue?.exchange === quote.exchange) return;

        analytics.report({
            type: EventType.TradingParameterChanged,
            payload: {
                type: 'buy',
                parameter: 'provider',
            },
        });
    };

    if (isLoading) {
        return (
            <OverviewRow
                title={translate('moduleTrading.tradingScreen.provider')}
                noBottomBorder
                noCaret
            >
                <OverviewValueSkeleton />
            </OverviewRow>
        );
    }

    if (!providerKey || !providers || providers[providerKey] === undefined) {
        return null;
    }

    const { companyName, logo } = providers[providerKey];

    return (
        <>
            <OverviewRow
                title={translate('moduleTrading.tradingScreen.provider')}
                noBottomBorder
                onPress={handleProviderPress}
                testID={PROVIDER_PICKER_TEST_ID}
            >
                <HStack>
                    <ProviderLogo logo={logo} />
                    <Text
                        color="textSubdued"
                        variant="body"
                        accessibilityLabel={translate(
                            'moduleTrading.tradingScreen.selectedProvider',
                        )}
                        testID={PROVIDER_PICKER_TEST_ID + '/value'}
                    >
                        {companyName}
                    </Text>
                </HStack>
            </OverviewRow>
            <ProviderSheet
                quotes={quotes}
                providerInfos={providers}
                isVisible={isSheetVisible}
                onClose={hideSheet}
                onQuoteSelect={handleQuoteSelect}
                selectedQuote={selectedValue}
            />
        </>
    );
};
