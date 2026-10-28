import { selectIsDebugModeActive } from '@suite/debug';
import { TransactionStoreFeeder } from '@suite/transaction-store';

import { useSelector } from 'src/hooks/suite';

/** The transaction store runs in its worker only in debug mode until it has a consumer. */
export const TransactionStore = () => {
    const isDebugModeActive = useSelector(selectIsDebugModeActive);

    return isDebugModeActive ? <TransactionStoreFeeder /> : null;
};
