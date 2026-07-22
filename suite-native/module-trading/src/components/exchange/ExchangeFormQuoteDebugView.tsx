import { cryptoIdToNetworkAndContractAddress, getApprovalStatus } from '@suite-common/trading';
import { findToken, isAllowanceUnlimited } from '@suite-common/wallet-utils';
import { HStack, Text } from '@suite-native/atoms';
import { useWatch } from '@suite-native/forms';
import { DebugModeView } from '@suite-native/trading-debug';

import { ExchangeUsdcPresetButton } from './ExchangeUsdcPresetButton';
import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';

export const ExchangeFormQuoteDebugView = () => {
    const { control } = useExchangeFormContext();
    const [quote, sendAccount] = useWatch({ control, name: ['quote', 'sendAccount'] });

    const approvalStatus = getApprovalStatus(quote);
    const { contractAddress } = cryptoIdToNetworkAndContractAddress(quote?.send);
    const { decimals } = findToken(sendAccount?.tokens, contractAddress) ?? {};

    let preapproved = 'not defined';
    if (quote?.preapprovedStringAmount) {
        const isUnlimited =
            typeof decimals === 'number' &&
            isAllowanceUnlimited({ amount: quote.preapprovedStringAmount, decimals });

        preapproved = isUnlimited ? 'unlimited' : quote.preapprovedStringAmount;
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
