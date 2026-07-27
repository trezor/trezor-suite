import { useSelector } from 'react-redux';

import {
    type TradingRootState,
    type TradingType,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { HStack, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ProviderLogo, TradeInfoRow } from '@suite-native/trading-atoms';

export type ProviderInfoRowProps = {
    exchange: string | undefined;
    tradingType: TradingType;
    noBorder?: boolean;
};

export const ProviderInfoRow = ({ exchange, noBorder, tradingType }: ProviderInfoRowProps) => {
    const providerInfo = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, exchange, tradingType),
    );

    if (!providerInfo) {
        return null;
    }

    return (
        <TradeInfoRow noBorder={noBorder}>
            <Text variant="body-sm" color="contentSecondary">
                <Translation id="moduleTrading.tradingScreen.provider" />
            </Text>
            <HStack alignItems="center">
                {!!providerInfo.logo && <ProviderLogo logo={providerInfo.logo} size="body-sm" />}
                <Text variant="body-sm">{providerInfo.companyName}</Text>
            </HStack>
        </TradeInfoRow>
    );
};
