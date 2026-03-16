import { useSelector } from 'react-redux';

import type { ExchangeProviderInfo } from 'invity-api';

import {
    type TradingRootState,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { HStack, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ProviderLogo, TradeInfoRow } from '@suite-native/trading-atoms';

export type ProviderInfoRowProps = {
    exchange: string | undefined;
};

export const ProviderInfoRow = ({ exchange }: ProviderInfoRowProps) => {
    const providerInfo = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, exchange, 'exchange'),
    ) as ExchangeProviderInfo | undefined;

    if (!providerInfo) {
        return null;
    }

    return (
        <TradeInfoRow>
            <Text variant="body-sm">
                <Translation id="moduleTrading.tradingScreen.provider" />
            </Text>
            <HStack alignItems="center">
                {!!providerInfo.logo && <ProviderLogo logo={providerInfo.logo} size="body-sm" />}
                <Text variant="body-sm" color="textSubdued">
                    {providerInfo.companyName}
                </Text>
            </HStack>
        </TradeInfoRow>
    );
};
