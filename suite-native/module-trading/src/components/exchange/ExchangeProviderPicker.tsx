import { useSelector } from 'react-redux';

import { ExchangeTrade } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import { selectTradingExchangeProviders } from '@suite-common/trading';
import { HStack, Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';
import { selectTradingExchangeIsLoading } from '../../selectors/exchangeSelectors';
import { OverviewRow } from '../general/OverviewRow';
import { OverviewValueSkeleton } from '../general/OverviewValueSkeleton';
import { ProviderLogo } from '../general/ProviderLogo';

type ExchangeProviderPickerRightProps = {
    isLoading: boolean;
    selectedValue: ExchangeTrade | undefined;
};
const noop = () => {};

const ExchangeProviderPickerRight = ({
    isLoading,
    selectedValue,
}: ExchangeProviderPickerRightProps) => {
    const { translate } = useTranslate();
    const providers = useSelector(selectTradingExchangeProviders);

    if (isLoading) {
        return <OverviewValueSkeleton />;
    }

    const { exchange = '' } = selectedValue ?? {};
    const selectedProvider = providers?.[exchange];
    invariant(selectedProvider, 'Selected provider should be defined');
    const { companyName, logo } = selectedProvider;

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
    const { watch } = useExchangeFormContext();
    const isLoading = useSelector(selectTradingExchangeIsLoading);

    const selectedValue = watch('quote');

    if (!selectedValue && !isLoading) {
        return null;
    }

    return (
        <OverviewRow
            title={translate('moduleTrading.tradingScreen.provider')}
            noBottomBorder
            onPress={noop}
            noCaret={isLoading}
        >
            <ExchangeProviderPickerRight isLoading={isLoading} selectedValue={selectedValue} />
        </OverviewRow>
    );
};
