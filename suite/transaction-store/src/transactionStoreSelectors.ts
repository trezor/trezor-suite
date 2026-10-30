import { type DebugRootState, selectIsDebugModeActive } from '@suite/debug';
import { type SuiteSettingsRootState, selectIsTransactionStoreEnabled } from '@suite/settings';

type TransactionStoreRootState = DebugRootState & SuiteSettingsRootState;

/**
 * The store runs, and serves the transaction list, only while its Debug settings switch is on
 * in debug mode, until it replaces the Redux history. Debug mode alone (as E2E tests use it)
 * keeps the regular list.
 */
export const selectIsTransactionStoreActive = (state: TransactionStoreRootState) =>
    selectIsDebugModeActive(state) && selectIsTransactionStoreEnabled(state);
