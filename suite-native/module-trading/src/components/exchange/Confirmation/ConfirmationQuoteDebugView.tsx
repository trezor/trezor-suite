import { useSelector } from 'react-redux';

import { selectTradingExchangeActiveQuote, useAllowanceTxTracking } from '@suite-common/trading';
import type { AccountKey } from '@suite-common/wallet-types';
import { HStack, Text } from '@suite-native/atoms';
import { DebugModeView } from '@suite-native/trading-debug';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

export const ConfirmationQuoteDebugView = () => {
    const quote = useSelector(selectTradingExchangeActiveQuote);
    const sendAccount = useSelector(selectExchangeSelectedSendAccount);

    const { status, approvalTxid } = useAllowanceTxTracking({
        accountKey: sendAccount?.key ?? ('' as AccountKey),
    });

    return (
        <DebugModeView>
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
