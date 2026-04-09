import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import {
    cryptoIdToNetworkAndContractAddress,
    selectTradingExchangeActiveQuote,
} from '@suite-common/trading';
import { Card, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import type { TradingConfirmationVariant } from '@suite-native/navigation';
import { TradeInfoRow } from '@suite-native/trading-atoms';
import { FeeSummaryCard } from '@suite-native/transaction-management';

import { ProviderInfoRow } from '../../general/TradeInfo/ProviderInfoRow';
import { LimitInfoRow } from '../Approval/LimitInfoRow';

export type ExchangeConfirmationInfoCardProps = {
    variant: TradingConfirmationVariant;
};

export const ExchangeConfirmationInfo = ({ variant }: ExchangeConfirmationInfoCardProps) => {
    const { DateFormatter, TimeFormatter } = useFormatters();

    const date = useMemo(() => new Date(), []);
    const quote = useSelector(selectTradingExchangeActiveQuote);

    if (!quote?.send) {
        return null;
    }

    const { send, sendStringAmount, approvalType, fee, exchange } = quote;
    const { network } = cryptoIdToNetworkAndContractAddress(send);

    if (!network?.symbol) {
        return null;
    }

    const feeValueAsString = typeof fee === 'number' ? String(fee) : '0';

    return (
        <VStack spacing="sp16" paddingVertical="sp16">
            <Card noPadding>
                <TradeInfoRow>
                    <Text variant="body-sm">
                        <Translation id="moduleTrading.tradingConfirmationScreen.date" />
                    </Text>
                    <VStack>
                        <Text variant="body-sm" textAlign="right">
                            <DateFormatter value={date} />
                        </Text>
                        <Text variant="body-sm" color="textSubdued" textAlign="right">
                            <TimeFormatter value={date} />
                        </Text>
                    </VStack>
                </TradeInfoRow>
                <ProviderInfoRow exchange={exchange} />
                {variant === 'approve' && (
                    <LimitInfoRow
                        testID="ExchangeApproval/LimitPicker"
                        cryptoId={send}
                        amount={sendStringAmount}
                        approvalType={approvalType}
                    />
                )}
            </Card>
            <FeeSummaryCard
                fee={feeValueAsString}
                symbol={network.symbol}
                networkType={network.networkType}
                areFeesLoading={false}
            />
        </VStack>
    );
};
