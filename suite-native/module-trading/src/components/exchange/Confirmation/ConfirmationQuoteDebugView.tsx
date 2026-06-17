import { useSelector } from 'react-redux';

import { type TransactionStatus, selectTradingExchangeSelectedQuote } from '@suite-common/trading';
import { Button, HStack, Text } from '@suite-native/atoms';
import { DebugModeView, type TransactionStatusWithOverride } from '@suite-native/trading-debug';

export type ConfirmationQuoteDebugViewProps = {
    approvalTxid: string | null;
    forceStatus: TransactionStatusWithOverride['forceStatus'];
    transactionStatus: TransactionStatus;
};

export const ConfirmationQuoteDebugView = ({
    approvalTxid,
    forceStatus,
    transactionStatus,
}: ConfirmationQuoteDebugViewProps) => {
    const quote = useSelector(selectTradingExchangeSelectedQuote);

    return (
        <DebugModeView>
            <HStack justifyContent="center">
                <Button size="medium" onPress={() => forceStatus('no-override')} intent="neutral">
                    No override
                </Button>
                <Button size="medium" onPress={() => forceStatus('none')} intent="accentViolet">
                    None
                </Button>
            </HStack>
            <HStack justifyContent="center" paddingTop="sp2">
                <Button size="medium" onPress={() => forceStatus('isPending')} intent="warning">
                    Pending
                </Button>
                <Button size="medium" onPress={() => forceStatus('isFailed')} intent="critical">
                    Failed
                </Button>
                <Button size="medium" onPress={() => forceStatus('isConfirmed')} intent="brand">
                    Confirmed
                </Button>
            </HStack>
            <HStack>
                <Text variant="body-xs">Quote status</Text>
                <Text variant="body-xs" color="contentSecondary">
                    {quote?.status ?? 'none'}
                </Text>
            </HStack>
            <HStack>
                <Text variant="body-xs">Approval status</Text>
                <Text variant="body-xs" color="contentSecondary">
                    {[
                        transactionStatus.isPending && 'pending',
                        transactionStatus.isConfirmed && 'confirmed',
                        transactionStatus.isFailed && 'failed',
                    ]
                        .filter(Boolean)
                        .join(' ') || 'none'}
                </Text>
            </HStack>
            <HStack>
                <Text variant="body-xs">approvalTxid</Text>
                <Text variant="body-xs" color="contentSecondary">
                    {approvalTxid ?? 'not defined'}
                </Text>
            </HStack>
        </DebugModeView>
    );
};
