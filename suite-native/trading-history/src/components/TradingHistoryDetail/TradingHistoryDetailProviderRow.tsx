import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ProviderDisplay, TradeInfoRow } from '@suite-native/trading-atoms';

import { type TradingHistoryDetailProvider } from '../../hooks/useTradingHistoryDetailInfo';

type TradingHistoryDetailProviderRowProps = {
    provider: TradingHistoryDetailProvider;
};

export const TradingHistoryDetailProviderRow = ({
    provider,
}: TradingHistoryDetailProviderRowProps) => (
    <TradeInfoRow>
        <Text color="contentSecondary" variant="body-sm">
            <Translation id="moduleTrading.tradeHistory.detail.info.provider" />
        </Text>
        <ProviderDisplay logo={provider.logo} logoSize="body-md" providerName={provider.name} />
    </TradeInfoRow>
);
