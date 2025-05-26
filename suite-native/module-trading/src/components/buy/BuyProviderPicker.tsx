import { useSelector } from 'react-redux';

import { BuyTrade } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
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

type BuyProviderPickerRightProps = {
    isLoading: boolean;
    selectedValue: BuyTrade | undefined;
    providers: ReturnType<typeof selectTradingBuyProviders>;
};

const PROVIDER_PICKER_TEST_ID = '@trading/buy/provider-picker';

const BuyProviderPickerRight = ({
    isLoading,
    selectedValue,
    providers,
}: BuyProviderPickerRightProps) => {
    const { translate } = useTranslate();

    if (isLoading) {
        return <OverviewValueSkeleton />;
    }

    const { exchange } = selectedValue ?? {};
    const selectedProvider = exchange ? providers?.[exchange] : undefined;
    invariant(selectedProvider, 'Selected provider should be defined');
    const { companyName, logo } = selectedProvider;

    return (
        <HStack>
            <ProviderLogo logo={logo} />
            <Text
                color="textSubdued"
                variant="body"
                accessibilityLabel={translate('moduleTrading.tradingScreen.selectedProvider')}
                testID={PROVIDER_PICKER_TEST_ID + '/value'}
            >
                {companyName}
            </Text>
        </HStack>
    );
};

export const BuyProviderPicker = () => {
    const { translate } = useTranslate();
    const form = useBuyFormContext();
    const providers = useSelector(selectTradingBuyProviders);
    const isLoading = useSelector(selectTradingBuyIsLoading);

    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useSheetControls(form, 'quote');
    const { paymentMethod } = selectedValue ?? {};
    const quotes =
        useSelector((state: TradingRootState) =>
            selectBuyQuotesByPaymentMethod(state, paymentMethod),
        ) ?? [];

    const shouldShowPicker = (providers && quotes.length > 0) || isLoading;

    const handleProviderPress = () => {
        if (isLoading) return;

        showSheet();
        analytics.report({
            type: EventType.TradingCompareOffers,
            payload: {
                type: 'buy',
            },
        });
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

    if (!shouldShowPicker) {
        return null;
    }

    return (
        <>
            <OverviewRow
                title={translate('moduleTrading.tradingScreen.provider')}
                noBottomBorder
                onPress={handleProviderPress}
                testID={PROVIDER_PICKER_TEST_ID}
                noCaret={isLoading}
            >
                <BuyProviderPickerRight
                    isLoading={isLoading}
                    selectedValue={selectedValue}
                    providers={providers}
                />
            </OverviewRow>
            <ProviderSheet
                quotes={quotes}
                providerInfos={providers ?? {}}
                isVisible={isSheetVisible}
                onClose={hideSheet}
                onQuoteSelect={handleQuoteSelect}
                selectedQuote={selectedValue}
            />
        </>
    );
};
