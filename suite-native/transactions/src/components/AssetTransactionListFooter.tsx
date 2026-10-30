import { OlderHistoryStatus } from './OlderHistoryStatus';
import { TransactionsListFooter } from './TransactionsListFooter';

type AssetTransactionListFooterProps = {
    hasMoreTransactions: boolean;
    needsOlderHistoryScan: boolean;
    historyCoveredSince: number | undefined;
    hasLoadingFailed: boolean;
    isInitialLoading: boolean;
    isLoadingMore: boolean;
    onLoadMore: () => void;
};

export const AssetTransactionListFooter = ({
    hasMoreTransactions,
    needsOlderHistoryScan,
    historyCoveredSince,
    hasLoadingFailed,
    isInitialLoading,
    isLoadingMore,
    onLoadMore,
}: AssetTransactionListFooterProps) => {
    if (isInitialLoading) {
        return null;
    }

    return (
        <TransactionsListFooter
            hasMoreTransactions={hasMoreTransactions}
            isOlderHistory={needsOlderHistoryScan}
            isLoading={isLoadingMore}
            onButtonPress={onLoadMore}
        >
            {(needsOlderHistoryScan || hasLoadingFailed) && (
                <OlderHistoryStatus
                    historyCoveredSince={historyCoveredSince}
                    hasLoadingFailed={hasLoadingFailed}
                />
            )}
        </TransactionsListFooter>
    );
};
