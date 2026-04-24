import { useSelector } from 'react-redux';

import { type TransactionStatus, selectTradingExchangeActiveQuote } from '@suite-common/trading';
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
    const quote = useSelector(selectTradingExchangeActiveQuote);

    return (
        <DebugModeView>
            <HStack>
                <Button size="small" onPress={() => forceStatus('none')} intent="accentViolet">
                    None
                </Button>
                <Button size="small" onPress={() => forceStatus('isPending')} intent="warning">
                    Pending
                </Button>
                <Button size="small" onPress={() => forceStatus('isFailed')} intent="critical">
                    Failed
                </Button>
                <Button size="small" onPress={() => forceStatus('isConfirmed')} intent="brand">
                    Confirmed
                </Button>
                <Button size="small" onPress={() => forceStatus('no-override')} intent="neutral">
                    No override
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
