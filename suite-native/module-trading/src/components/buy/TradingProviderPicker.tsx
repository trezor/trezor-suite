import { useSelector } from 'react-redux';

import {
    TradingRootState,
    TradingTradeType,
    selectBuyQuotesByPaymentMethod,
    selectTradingBuyIsLoading,
    selectTradingBuyProviders,
} from '@suite-common/trading';
import { EventType, analytics } from '@suite-native/analytics';
import { HStack, Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { useTradeSheetControls } from '../../hooks/useTradeSheetControls';
import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';
import { ProvidersSheet } from '../general/ProviderSheet/ProvidersSheet';
import { TradingOverviewRow } from '../general/TradingOverviewRow';
import { TradingOverviewValueSkeleton } from '../general/TradingOverviewValueSkeleton';
import { TradingProviderLogo } from '../general/TradingProviderLogo';

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
            >
                <HStack>
                    <TradingProviderLogo logo={logo} />
                    <Text
                        color="textSubdued"
                        variant="body"
                        accessibilityLabel={translate(
                            'moduleTrading.tradingScreen.selectedProvider',
                        )}
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
                onQuoteSelect={setSelectedValue as (quote: TradingTradeType) => void}
                selectedQuote={selectedValue}
            />
        </>
    );
};
