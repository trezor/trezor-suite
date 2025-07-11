import { useSelector } from 'react-redux';

import { ExchangeTrade } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import {
    TradingRootState,
    selectTradingProviderByNameAndTradeType,
    selectTradingProviderKycPolicy,
} from '@suite-common/trading';
import { HStack, Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';
import { selectTradingExchangeIsLoading } from '../../selectors/exchangeSelectors';
import { getKycPolicyWarningTranslation } from '../../utils/general/kycUtils';
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
    const { exchange } = selectedValue ?? {};
    const provider = useSelector((state: TradingRootState) =>
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
    const { watch } = useExchangeFormContext();
    const isLoading = useSelector(selectTradingExchangeIsLoading);

    const selectedValue = watch('quote');
    const kycPolicy = useSelector((state: TradingRootState) =>
        selectTradingProviderKycPolicy(state, selectedValue?.exchange, 'exchange'),
    );
    const warning = isLoading ? undefined : getKycPolicyWarningTranslation(kycPolicy);

    if (!selectedValue && !isLoading) {
        return null;
    }

    return (
        <OverviewRow
            title={translate('moduleTrading.tradingScreen.provider')}
            noBottomBorder
            onPress={noop}
            noCaret={isLoading}
            warning={warning}
        >
            <ExchangeProviderPickerRight isLoading={isLoading} selectedValue={selectedValue} />
        </OverviewRow>
    );
};
