import { selectNetworkConfigDeps } from '@suite-common/networks';
import { useServices } from '@suite-common/dependency-injection';
import { cryptoIdToNetworkAndContractAddress, getApprovalStatus } from '@suite-common/trading';
import { findToken, isAllowanceUnlimited } from '@suite-common/wallet-utils';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { useWatch } from '@suite-native/forms';
import { DebugModeView } from '@suite-native/trading-debug';

import { ExchangeUsdcPresetButton } from './ExchangeUsdcPresetButton';
import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';

export const ExchangeFormQuoteDebugView = () => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const { control } = useExchangeFormContext();
    const [quote, sendAccount] = useWatch({ control, name: ['quote', 'sendAccount'] });

    const approvalStatus = getApprovalStatus(networkConfigDeps, quote);
    const { contractAddress } = cryptoIdToNetworkAndContractAddress(networkConfigDeps, quote?.send);
    const { decimals } = findToken(sendAccount?.tokens, contractAddress) ?? {};

    let preapproved = 'not defined';
    if (quote?.preapprovedStringAmount) {
        const isUnlimited =
            typeof decimals === 'number' &&
            isAllowanceUnlimited(networkConfigDeps, {
                amount: quote.preapprovedStringAmount,
                decimals,
            });

        preapproved = isUnlimited ? 'unlimited' : quote.preapprovedStringAmount;
    }

    return (
        <DebugModeView>
            <HStack justifyContent="space-between">
                <VStack spacing="sp2" justifyContent="center">
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
                </VStack>
                <ExchangeUsdcPresetButton />
            </HStack>
        </DebugModeView>
    );
};
