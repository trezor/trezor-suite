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
                <Button
                    size="tiny"
                    colorScheme="tertiaryElevation0"
                    onPress={() => forceStatus('none')}
                >
                    None
                </Button>
                <Button
                    size="tiny"
                    colorScheme="yellowElevation0"
                    onPress={() => forceStatus('isPending')}
                >
                    Pending
                </Button>
                <Button
                    size="tiny"
                    colorScheme="redElevation0"
                    onPress={() => forceStatus('isFailed')}
                >
                    Failed
                </Button>
                <Button
                    size="tiny"
                    colorScheme="blueElevation0"
                    onPress={() => forceStatus('isConfirmed')}
                >
                    Confirmed
                </Button>
                <Button
                    size="tiny"
                    colorScheme="secondary"
                    onPress={() => forceStatus('no-override')}
                >
                    No override
                </Button>
            </HStack>
            <HStack>
                <Text variant="body-xs">Quote status</Text>
                <Text variant="body-xs" color="textSubdued">
                    {quote?.status ?? 'none'}
                </Text>
            </HStack>
            <HStack>
                <Text variant="body-xs">Approval status</Text>
                <Text variant="body-xs" color="textSubdued">
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
                <Text variant="body-xs" color="textSubdued">
                    {approvalTxid ?? 'not defined'}
                </Text>
            </HStack>
        </DebugModeView>
    );
};
