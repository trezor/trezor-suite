import { events } from '@suite-common/analytics';
import { type YieldPendingTransactionState } from '@suite-common/wallet-core';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { useTransactionDetails } from '@suite-native/transaction-management';
import { useServices } from '@trezor/dependency-injection';

type UseYieldPendingTransactionDetailsParams = Parameters<typeof useTransactionDetails>[0] & {
    transactionType: YieldPendingTransactionState['type'] | undefined;
    vaultId?: string;
};

export const useYieldPendingTransactionDetails = ({
    transactionType,
    vaultId,
    ...params
}: UseYieldPendingTransactionDetailsParams) => {
    const { analytics } = useServices(injectNativeAnalytics);
    const details = useTransactionDetails(params);

    const openInBlockchain = () => {
        if (!details.explorerUrl) return;

        if (transactionType) {
            analytics.report({
                type: events.yieldInteractionEvent.name,
                payload: {
                    element: 'pending-tx-open',
                    value: transactionType,
                    networkSymbol: details.transaction?.symbol,
                    vaultId,
                },
            });
        }

        details.openInBlockchain();
    };

    return { ...details, openInBlockchain };
};
