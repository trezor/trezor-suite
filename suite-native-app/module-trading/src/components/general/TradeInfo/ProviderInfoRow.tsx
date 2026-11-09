import { useSelector } from 'react-redux';

import {
    type TradingRootState,
    type TradingType,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ProviderDisplay, TradeInfoRow } from '@suite-native/trading-atoms';

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
            <ProviderDisplay logo={providerInfo.logo} providerName={providerInfo.companyName} />
        </TradeInfoRow>
    );
};
