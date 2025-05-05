import {
    PassphraseFlowAction,
    PassphraseWalletState,
    finishPassphraseFlow,
    resetPassphraseFlow,
    setPassphraseFlowState,
    setPassphraseFlowTransactionLoading,
    startPassphraseFlow,
} from '../../actions/wallet/passphraseFlowActions';

export type PassphraseFlowState = {
    state: PassphraseWalletState;
    id: string;
    isExisting: boolean;
    previousState: PassphraseWalletState | null;
    loading: boolean;
} | null;

export const initialState: PassphraseFlowState = null;

export default function passphraseFlowReducer(
    state = initialState,
    action: PassphraseFlowAction,
): PassphraseFlowState {
    if (startPassphraseFlow.match(action)) {
        return {
            state: action.payload.initialState,
            id: action.payload.id,
            isExisting: action.payload.isExisting,
            previousState: null,
            loading: false,
        };
    }

    if (setPassphraseFlowState.match(action)) {
        if (!state) {
            console.warn('Cannot set state: Passphrase flow not initialized');

            return null;
        }

        return {
            ...state,
            previousState: state.state, // Store current state as previous
            state: action.payload.state,
            loading: action.payload.maintainLoadingForState ? state.loading : false,
        };
    }

    if (setPassphraseFlowTransactionLoading.match(action)) {
        if (!state) {
            console.warn('Cannot set transaction loading: Passphrase flow not initialized');

            return null;
        }

        return {
            ...state,
            loading: action.payload.loading,
        };
    }

    if (resetPassphraseFlow.match(action) || finishPassphraseFlow.match(action)) {
        return null;
    }

    return state;
}
