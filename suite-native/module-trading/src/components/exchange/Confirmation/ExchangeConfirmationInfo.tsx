import { useMemo } from 'react';
import { LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import {
    cryptoIdToNetworkAndContractAddress,
    selectTradingExchangeActiveQuote,
} from '@suite-common/trading';
import { AnimatedVStack, Card, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import type { ConfirmingScreenFlowType } from '@suite-native/navigation';
import { TradeInfoRow } from '@suite-native/trading-atoms';
import { FeeSummaryCard } from '@suite-native/transaction-management';

import { ProviderInfoRow } from '../../general/TradeInfo/ProviderInfoRow';
import { LimitInfoRow } from '../Approval/LimitInfoRow';

export type ExchangeConfirmationInfoCardProps = {
    flowType: ConfirmingScreenFlowType;
};

export const ExchangeConfirmationInfo = ({ flowType }: ExchangeConfirmationInfoCardProps) => {
    const { DateFormatter, TimeFormatter } = useFormatters();

    // TODO 27125: Get real date from transaction data.
    const date = useMemo(() => new Date(), []);
    const quote = useSelector(selectTradingExchangeActiveQuote);

    if (!quote?.send) {
        return null;
    }

    const { send, fee, exchange } = quote;
    const { network } = cryptoIdToNetworkAndContractAddress(send);

    if (!network?.symbol) {
        return null;
    }

    const feeValueAsString = typeof fee === 'number' ? String(fee) : '0';

    return (
        <AnimatedVStack spacing="sp16" paddingVertical="sp16" layout={LinearTransition}>
            <Card noPadding>
                <TradeInfoRow>
                    <Text variant="body-sm">
                        <Translation id="moduleTrading.tradingConfirmationScreen.date" />
                    </Text>
                    <VStack>
                        <Text variant="body-sm" textAlign="right">
                            <DateFormatter value={date} />
                        </Text>
                        <Text variant="body-sm" color="contentSecondary" textAlign="right">
                            <TimeFormatter value={date} />
                        </Text>
                    </VStack>
                </TradeInfoRow>
                <ProviderInfoRow exchange={exchange} />
                {flowType === 'approve' && <LimitInfoRow testID="ExchangeApproval/LimitPicker" />}
            </Card>
            <FeeSummaryCard
                fee={feeValueAsString}
                symbol={network.symbol}
                networkType={network.networkType}
                areFeesLoading={false}
            />
        </AnimatedVStack>
    );
};
