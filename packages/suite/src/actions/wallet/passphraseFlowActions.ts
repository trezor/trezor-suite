import { createAction } from '@reduxjs/toolkit';

/**
 * Define passphrase wallet state types directly to avoid circular dependencies
 */
export type PassphraseWalletExistsState =
    | 'exists-enter-passphrase'
    | 'exists-awaiting-discovery'
    | 'exists-confirm-passphrase'
    | 'exists-best-practices'
    | 'exists-empty-wallet'
    | 'exists-passphrase-mismatch-warning';

export type PassphraseWalletNotExistsState =
    | 'not-exist-enter-passphrase'
    | 'not-exist-best-practices'
    | 'not-exist-confirm-passphrase'
    | 'not-exist-awaiting-discovery'
    | 'not-exist-passphrase-mismatch-warning';

export type PassphraseCommonStates = 'initial' | 'passphrase-duplicate';

export type PassphraseWalletState =
    | PassphraseWalletExistsState
    | PassphraseWalletNotExistsState
    | PassphraseCommonStates;

/**
 * Define action types for passphrase flow
 */
export type PassphraseFlowAction =
    | ReturnType<typeof startPassphraseFlow>
    | ReturnType<typeof setPassphraseFlowState>
    | ReturnType<typeof resetPassphraseFlow>
    | ReturnType<typeof finishPassphraseFlow>
    | ReturnType<typeof setPassphraseFlowTransactionLoading>;

export const PASSPHRASE_FLOW_MODULE_PREFIX = '@suite/passphrase-flow';

/**
 * Action creators for passphrase flow
 */
export const startPassphraseFlow = createAction(
    `${PASSPHRASE_FLOW_MODULE_PREFIX}/start`,
    (payload: { isExisting: boolean; id: string; initialState?: PassphraseWalletState }) => ({
        payload: {
            isExisting: payload.isExisting,
            id: payload.id,
            initialState: payload.initialState ?? 'initial',
        },
    }),
);

export const setPassphraseFlowState = createAction(
    `${PASSPHRASE_FLOW_MODULE_PREFIX}/set-state`,
    (payload: { state: PassphraseWalletState; maintainLoadingForState?: boolean }) => ({
        payload,
    }),
);

export const setPassphraseFlowTransactionLoading = createAction(
    `${PASSPHRASE_FLOW_MODULE_PREFIX}/set-transaction-loading`,
    (
        payload: {
            loading: boolean;
        } = {
            loading: true,
        },
    ) => ({
        payload,
    }),
);

export const resetPassphraseFlow = createAction(`${PASSPHRASE_FLOW_MODULE_PREFIX}/reset`);

export const finishPassphraseFlow = createAction(`${PASSPHRASE_FLOW_MODULE_PREFIX}/finish`);
