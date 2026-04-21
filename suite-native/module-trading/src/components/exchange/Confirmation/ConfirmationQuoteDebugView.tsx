import { useSelector } from 'react-redux';

import { selectTradingExchangeActiveQuote, useAllowanceTxTracking } from '@suite-common/trading';
import type { AccountKey } from '@suite-common/wallet-types';
import { Button, HStack, Text } from '@suite-native/atoms';
import { DebugModeView, type TransactionStatusWithOverride } from '@suite-native/trading-debug';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

export type ConfirmationQuoteDebugViewProps = {
    forceStatus: TransactionStatusWithOverride['forceStatus'];
};

export const ConfirmationQuoteDebugView = ({ forceStatus }: ConfirmationQuoteDebugViewProps) => {
    const quote = useSelector(selectTradingExchangeActiveQuote);
    const sendAccount = useSelector(selectExchangeSelectedSendAccount);

    const { status, approvalTxid } = useAllowanceTxTracking({
        accountKey: sendAccount?.key ?? ('' as AccountKey),
    });

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
                        status.isPending && 'pending',
                        status.isConfirmed && 'confirmed',
                        status.isFailed && 'failed',
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
