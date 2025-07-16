import { useSelector } from 'react-redux';

import { ExchangeTrade } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import {
    selectTradingExchangeIsLoading,
    selectTradingExchangeProviders,
} from '@suite-common/trading';
import { HStack, Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';
import { OverviewRow } from '../general/OverviewRow';
import { OverviewValueSkeleton } from '../general/OverviewValueSkeleton';

type ExchangeRatePickerRightProps = {
    isLoading: boolean;
    selectedValue: ExchangeTrade | undefined;
};
const noop = () => {};

const ExchangeRatePickerRight = ({ isLoading, selectedValue }: ExchangeRatePickerRightProps) => {
    const { translate } = useTranslate();
    const providers = useSelector(selectTradingExchangeProviders);

    if (isLoading) {
        return <OverviewValueSkeleton />;
    }

    const { exchange = '' } = selectedValue ?? {};
    const selectedProvider = providers?.[exchange];
    invariant(selectedProvider, 'Selected provider should be defined');
    const rate = selectedProvider.isFixedRate
        ? translate('moduleTrading.selectRate.fixed')
        : translate('moduleTrading.selectRate.floating');

    return (
        <HStack>
            <Text
                color="textSubdued"
                variant="body"
                accessibilityLabel={translate('moduleTrading.tradingScreen.selectedRate')}
            >
                {rate}
            </Text>
        </HStack>
    );
};

export const ExchangeRatePicker = () => {
    const { translate } = useTranslate();
    const { watch } = useExchangeFormContext();
    const isLoading = useSelector(selectTradingExchangeIsLoading);

    const selectedValue = watch('quote');

    if (!selectedValue && !isLoading) {
        return null;
    }

    return (
        <OverviewRow
            title={translate('moduleTrading.tradingScreen.rate')}
            onPress={noop}
            noCaret={isLoading}
        >
            <ExchangeRatePickerRight isLoading={isLoading} selectedValue={selectedValue} />
        </OverviewRow>
    );
};
