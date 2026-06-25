import { getApprovalStatus } from '@suite-common/trading';
import { isMaxAllowance } from '@suite-common/wallet-utils';
import { HStack, Text } from '@suite-native/atoms';
import { DebugModeView } from '@suite-native/trading-debug';

import { ExchangeUsdcPresetButton } from './ExchangeUsdcPresetButton';
import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';

export const ExchangeFormQuoteDebugView = () => {
    const { watch } = useExchangeFormContext();
    const quote = watch('quote');
    const approvalStatus = getApprovalStatus(quote);

    let preapproved = 'not defined';
    if (quote?.preapprovedStringAmount) {
        preapproved = isMaxAllowance(quote.preapprovedStringAmount)
            ? 'unlimited'
            : quote.preapprovedStringAmount;
    }

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
                    {preapproved}
                </Text>
            </HStack>
            <HStack>
                <ExchangeUsdcPresetButton />
            </HStack>
        </DebugModeView>
    );
};
