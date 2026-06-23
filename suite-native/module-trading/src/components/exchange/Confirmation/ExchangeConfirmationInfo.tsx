import { LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import type { ExchangeFee } from 'invity-api';

import { useFormatters } from '@suite-common/formatters';
import {
    type TradingRootState,
    cryptoIdToNetworkAndContractAddress,
    selectTradingDisplayComposedFee,
    selectTradingExchangeSelectedQuote,
} from '@suite-common/trading';
import { AnimatedVStack, Card, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import type { ConfirmingScreenFlowType } from '@suite-native/navigation';
import { type WalletAccountTransaction } from '@suite-native/tokens';
import { TradeInfoRow } from '@suite-native/trading-atoms';
import { FeeSummaryCard } from '@suite-native/transaction-management';

import { ProviderInfoRow } from '../../general/TradeInfo/ProviderInfoRow';
import { LimitInfoRow } from '../Approval/LimitInfoRow';

export type ExchangeConfirmationInfoCardProps = {
    flowType: ConfirmingScreenFlowType;
    transaction: WalletAccountTransaction | null | undefined;
};

const getFee = (transactionFee: string | undefined, quoteFee: ExchangeFee | undefined) => {
    if (transactionFee) {
        return transactionFee;
    }

    if (typeof quoteFee === 'number') {
        return quoteFee.toString();
    }

    return '0';
};

export const ExchangeConfirmationInfo = ({
    flowType,
    transaction,
}: ExchangeConfirmationInfoCardProps) => {
    const { DateFormatter, TimeFormatter } = useFormatters();

    const date = transaction?.blockTime ? new Date(transaction.blockTime * 1000) : null;
    const quote = useSelector(selectTradingExchangeSelectedQuote);
    // Same source/number as desktop: the precomposed network fee (fee_limit cap for Tron
    // contract-calls), read from the shared composedTransactionInfo state.
    const composedFee = useSelector((state: TradingRootState) =>
        selectTradingDisplayComposedFee(state, quote),
    );

    if (!quote?.send) {
        return null;
    }

    const { send, exchange } = quote;
    const { network } = cryptoIdToNetworkAndContractAddress(send);

    if (!network?.symbol) {
        return null;
    }

    // Prefer the realized on-chain fee once broadcast; before that show the precomposed
    // network fee (matches desktop), falling back to the quote fee.
    const fee = getFee(transaction?.fee ?? composedFee, quote.fee);

    return (
        <AnimatedVStack spacing="sp16" paddingVertical="sp16" layout={LinearTransition}>
            <Card noPadding>
                {date && (
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
                )}
                <ProviderInfoRow exchange={exchange} tradingType="exchange" />
                {flowType === 'approve' && <LimitInfoRow testID="ExchangeApproval/LimitPicker" />}
            </Card>
            <FeeSummaryCard
                fee={fee}
                symbol={network.symbol}
                networkType={network.networkType}
                areFeesLoading={false}
                label={<Translation id="transactions.detail.feeLabel" />}
            />
        </AnimatedVStack>
    );
};
