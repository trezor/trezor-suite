import { useSelector } from 'react-redux';

import { BuyTrade } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import {
    TradingRootState as TradingRootStateCommon,
    selectTradingBuyIsLoading,
    selectTradingBuyProviders,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { EventType, analytics } from '@suite-native/analytics';
import { HStack, Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { useSheetControls } from '../../hooks/general/useSheetControls';
import { TradingRootState } from '../../reducers';
import { selectBuyQuotesByPaymentMethodNative } from '../../selectors/buySelectors';
import { OverviewRow } from '../general/OverviewRow';
import { OverviewValueSkeleton } from '../general/OverviewValueSkeleton';
import { ProviderLogo } from '../general/ProviderLogo';
import { ProviderSheet } from '../general/ProviderSheet/ProviderSheet';

type BuyProviderPickerRightProps = {
    isLoading: boolean;
    selectedValue: BuyTrade | undefined;
};

const PROVIDER_PICKER_TEST_ID = '@trading/buy/provider-picker';

const BuyProviderPickerRight = ({ isLoading, selectedValue }: BuyProviderPickerRightProps) => {
    const { translate } = useTranslate();
    const { exchange } = selectedValue ?? {};

    const provider = useSelector((state: TradingRootStateCommon) =>
        selectTradingProviderByNameAndTradeType(state, exchange, 'buy'),
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
    const quotes = useSelector((state: TradingRootState) =>
        selectBuyQuotesByPaymentMethodNative(state, paymentMethod),
    );

    const shouldShowPicker = (providers && Object.values(quotes).flat().length > 0) || isLoading;

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
                warning={
                    isLoading ? undefined : translate('moduleTrading.tradingScreen.kycWarning')
                }
            >
                <BuyProviderPickerRight isLoading={isLoading} selectedValue={selectedValue} />
            </OverviewRow>
            <ProviderSheet<BuyTrade>
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
