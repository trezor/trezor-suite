import { useSelector } from 'react-redux';

import { ExchangeProviderInfo, ExchangeTrade } from 'invity-api';

import {
    TradingRootState as CommonTradingRootState,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { HStack, Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { OverviewRow } from '../general/OverviewRow';
import { OverviewValueSkeleton } from '../general/OverviewValueSkeleton';

type ExchangeRatePickerRightProps = {
    isLoading: boolean;
    selectedValue: ExchangeTrade | undefined;
};

export type ExchangeRatePickerProps = ExchangeRatePickerRightProps & {
    handleRatePress: () => void;
};

const ExchangeRatePickerRight = ({ isLoading, selectedValue }: ExchangeRatePickerRightProps) => {
    const { translate } = useTranslate();
    const { isFixedRate } = (useSelector((state: CommonTradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, selectedValue?.exchange, 'exchange'),
    ) ?? {}) as ExchangeProviderInfo;

    if (isLoading) {
        return <OverviewValueSkeleton />;
    }

    const rate = isFixedRate
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

export const ExchangeRatePicker = ({
    isLoading,
    selectedValue,
    handleRatePress,
}: ExchangeRatePickerProps) => {
    const { translate } = useTranslate();

    if (!selectedValue && !isLoading) {
        return null;
    }

    return (
        <OverviewRow
            title={translate('moduleTrading.tradingScreen.rate')}
            onPress={handleRatePress}
            noCaret={isLoading}
        >
            <ExchangeRatePickerRight isLoading={isLoading} selectedValue={selectedValue} />
        </OverviewRow>
    );
};
