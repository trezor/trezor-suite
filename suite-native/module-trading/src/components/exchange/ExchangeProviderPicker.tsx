import { useSelector } from 'react-redux';

import { ExchangeTrade } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import {
    TradingRootState as TradingRootStateCommon,
    selectTradingExchangeIsLoading,
    selectTradingExchangeProviders,
    selectTradingProviderByNameAndTradeType,
    selectTradingProviderKycPolicy,
} from '@suite-common/trading';
import { HStack, Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';
import { useSheetControls } from '../../hooks/general/useSheetControls';
import { selectGroupedExchangeQuotes } from '../../selectors/exchangeSelectors';
import { getKycPolicyWarningTranslation } from '../../utils/general/kycUtils';
import { OverviewRow } from '../general/OverviewRow';
import { OverviewValueSkeleton } from '../general/OverviewValueSkeleton';
import { ProviderLogo } from '../general/ProviderLogo';
import { ProviderSheet } from '../general/ProviderSheet/ProviderSheet';

type ExchangeProviderPickerRightProps = {
    isLoading: boolean;
    selectedValue: ExchangeTrade | undefined;
};

const ExchangeProviderPickerRight = ({
    isLoading,
    selectedValue,
}: ExchangeProviderPickerRightProps) => {
    const { translate } = useTranslate();
    const { exchange } = selectedValue ?? {};
    const provider = useSelector((state: TradingRootStateCommon) =>
        selectTradingProviderByNameAndTradeType(state, exchange, 'exchange'),
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
            >
                {companyName}
            </Text>
        </HStack>
    );
};

export const ExchangeProviderPicker = () => {
    const { translate } = useTranslate();
    const form = useExchangeFormContext();
    const isLoading = useSelector(selectTradingExchangeIsLoading);

    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useSheetControls(form, 'quote');

    const kycPolicy = useSelector((state: TradingRootStateCommon) =>
        selectTradingProviderKycPolicy(state, selectedValue?.exchange, 'exchange'),
    );
    const warning = isLoading ? undefined : getKycPolicyWarningTranslation(kycPolicy);
    const providers = useSelector(selectTradingExchangeProviders);

    const quotes = useSelector(selectGroupedExchangeQuotes);

    const handleProviderPress = () => {
        if (isLoading) return;

        showSheet();
    };

    const handleQuoteSelect = (quote: ExchangeTrade) => {
        setSelectedValue(quote);

        if (selectedValue?.exchange === quote.exchange) return;
    };

    if (!selectedValue && !isLoading) {
        return null;
    }

    return (
        <>
            <OverviewRow
                title={translate('moduleTrading.tradingScreen.provider')}
                noBottomBorder
                onPress={handleProviderPress}
                noCaret={isLoading}
                warning={warning}
            >
                <ExchangeProviderPickerRight isLoading={isLoading} selectedValue={selectedValue} />
            </OverviewRow>
            <ProviderSheet<ExchangeTrade>
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
