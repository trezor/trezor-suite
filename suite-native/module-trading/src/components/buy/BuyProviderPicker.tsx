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

import { useTradingBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { useTradeSheetControls } from '../../hooks/general/useSheetControls';
import { TradingOverviewRow } from '../general/OverviewRow';
import { TradingOverviewValueSkeleton } from '../general/OverviewValueSkeleton';
import { TradingProviderLogo } from '../general/ProviderLogo';
import { ProvidersSheet } from '../general/ProviderSheet/ProviderSheet';

const PROVIDER_PICKER_TEST_ID = '@trading/buy/provider-picker';

export const TradingProviderPicker = () => {
    const { translate } = useTranslate();
    const form = useTradingBuyFormContext();
    const providers = useSelector(selectTradingBuyProviders);
    const isLoading = useSelector(selectTradingBuyIsLoading);

    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useTradeSheetControls(form, 'quote');
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
            <TradingOverviewRow
                title={translate('moduleTrading.tradingScreen.provider')}
                noBottomBorder
                noCaret
            >
                <TradingOverviewValueSkeleton />
            </TradingOverviewRow>
        );
    }

    if (!providerKey || !providers || providers[providerKey] === undefined) {
        return null;
    }

    const { companyName, logo } = providers[providerKey];

    return (
        <>
            <TradingOverviewRow
                title={translate('moduleTrading.tradingScreen.provider')}
                noBottomBorder
                onPress={handleProviderPress}
                testID={PROVIDER_PICKER_TEST_ID}
            >
                <HStack>
                    <TradingProviderLogo logo={logo} />
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
            </TradingOverviewRow>

            <ProvidersSheet
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
