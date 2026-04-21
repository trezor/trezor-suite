import { getApprovalStatus } from '@suite-common/trading';
import { HStack, Text } from '@suite-native/atoms';
import { DebugModeView } from '@suite-native/trading-debug';

import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';

export const ExchangeFormQuoteDebugView = () => {
    const { watch } = useExchangeFormContext();
    const quote = watch('quote');
    const approvalStatus = getApprovalStatus(quote);

    return (
        <DebugModeView>
            <HStack>
                <Text variant="body-xs">Approval status</Text>
                <Text variant="body-xs" color="contentSecondary">
                    {approvalStatus ?? 'none'}
                </Text>
            </HStack>
            <HStack>
                <Text variant="body-xs">Pre-approved</Text>
                <Text variant="body-xs" color="contentSecondary">
                    {quote?.preapprovedStringAmount ?? 'not defined'}
                </Text>
            </HStack>
        </DebugModeView>
    );
};
