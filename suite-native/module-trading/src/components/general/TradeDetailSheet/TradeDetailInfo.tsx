import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import {
    TradingRootState,
    selectTradingProviderByNameAndTradeType,
    selectTradingTradeByOrderId,
} from '@suite-common/trading';
import { Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { TradeDetailInfoRow } from './TradeDetailInfoRow';
import { TradingProviderLogo } from '../TradingProviderLogo';

type TradeDetailInfoProps = {
    orderId: string;
};

export const TradeDetailInfo = ({ orderId }: TradeDetailInfoProps) => {
    const { DateFormatter, TimeFormatter } = useFormatters();
    const trade = useSelector((state: TradingRootState) =>
        selectTradingTradeByOrderId(state, orderId),
    );
    const providerInfo = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(
            state,
            trade?.data.exchange,
            trade?.tradeType ?? 'buy',
        ),
    );

    if (!trade) {
        return null;
    }

    const date = new Date(trade.date);

    return (
        <Card noPadding>
            <TradeDetailInfoRow
                title={<Translation id="moduleTrading.tradeHistory.detail.issued" />}
                content={
                    <VStack alignItems="flex-end" spacing="sp2">
                        <Text variant="hint">
                            <DateFormatter value={date} />
                        </Text>
                        <Text variant="hint" color="textSubdued">
                            <TimeFormatter value={date} />
                        </Text>
                    </VStack>
                }
            />

            {trade.tradeType !== 'exchange' && (
                <>
                    <TradeDetailInfoRow
                        title={<Translation id="moduleTrading.tradeHistory.detail.provider" />}
                        content={
                            <HStack>
                                {providerInfo?.logo && (
                                    <TradingProviderLogo logo={providerInfo.logo} />
                                )}
                                <Text>{providerInfo?.companyName}</Text>
                            </HStack>
                        }
                    />
                    <TradeDetailInfoRow
                        title={<Translation id="moduleTrading.tradeHistory.detail.method" />}
                        content={trade.data.paymentMethodName}
                    />
                </>
            )}
        </Card>
    );
};
