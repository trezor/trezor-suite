import reducer from 'src/reducers/wallet/passphraseFlowReducer';

import {
    finishPassphraseFlow,
    resetPassphraseFlow,
    setPassphraseFlowState,
    setPassphraseFlowTransactionLoading,
    startPassphraseFlow,
} from '../../../actions/wallet/passphraseFlowActions';

describe('passphraseFlow reducer', () => {
    it('test initial state', () => {
        expect(
            reducer(undefined, {
                // @ts-expect-error
                type: 'none',
            }),
        ).toEqual(null); // initialState is null
    });

    it('PASSPHRASE_FLOW.START with explicit initial state', () => {
        const state = reducer(
            null,
            startPassphraseFlow({
                id: 'device:1',
                isExisting: true,
                initialState: 'exists-enter-passphrase',
            }),
        );

        expect(state).toEqual({
            state: 'exists-enter-passphrase',
            id: 'device:1',
            isExisting: true,
            previousState: null,
            loading: false,
        });
    });

    it('PASSPHRASE_FLOW.START with default initial state', () => {
        const state = reducer(
            null,
            startPassphraseFlow({
                id: 'device:1',
                isExisting: true,
            }),
        );

        expect(state).toEqual({
            state: 'initial',
            id: 'device:1',
            isExisting: true,
            previousState: null,
            loading: false,
        });
    });

    it('PASSPHRASE_FLOW.SET_STATE with null state', () => {
        const state = reducer(
            null,
            setPassphraseFlowState({ state: 'not-exist-enter-passphrase' }),
        );

        expect(state).toBeNull();
    });

    it('PASSPHRASE_FLOW.SET_STATE with existing state', () => {
        const initialState = {
            state: 'initial' as const,
            id: 'device:1',
            isExisting: true,
            previousState: null,
            loading: false,
        };

        const state = reducer(
            initialState,
            setPassphraseFlowState({ state: 'not-exist-enter-passphrase' }),
        );

        expect(state).toEqual({
            ...initialState,
            state: 'not-exist-enter-passphrase',
            previousState: 'initial',
            loading: false,
        });
    });

    it('PASSPHRASE_FLOW.RESET', () => {
        const initialState = {
            state: 'initial' as const,
            id: 'device:1',
            isExisting: true,
            loading: false,
            previousState: null,
        };

        const state = reducer(initialState, resetPassphraseFlow());

        expect(state).toBeNull();
    });

    it('PASSPHRASE_FLOW.FINISH', () => {
        const initialState = {
            state: 'initial' as const,
            id: 'device:1',
            isExisting: true,
            loading: false,
            previousState: null,
        };

        const state = reducer(initialState, finishPassphraseFlow());

        expect(state).toBeNull();
    });

    it('handles state transitions correctly', () => {
        // Start the flow
        let state = reducer(
            null,
            startPassphraseFlow({
                id: 'device:1',
                isExisting: false,
                initialState: 'not-exist-enter-passphrase',
            }),
        );

        expect(state).toEqual({
            state: 'not-exist-enter-passphrase',
            id: 'device:1',
            isExisting: false,
            previousState: null,
            loading: false,
        });

        // Transition to awaiting discovery
        state = reducer(state, setPassphraseFlowState({ state: 'not-exist-awaiting-discovery' }));

        expect(state).toEqual({
            state: 'not-exist-awaiting-discovery',
            id: 'device:1',
            isExisting: false,
            previousState: 'not-exist-enter-passphrase',
            loading: false,
        });

        // Transition to confirm passphrase
        state = reducer(state, setPassphraseFlowState({ state: 'not-exist-confirm-passphrase' }));

        expect(state).toEqual({
            state: 'not-exist-confirm-passphrase',
            id: 'device:1',
            isExisting: false,
            previousState: 'not-exist-awaiting-discovery',
            loading: false,
        });

        // Finish the flow
        state = reducer(state, finishPassphraseFlow());

        expect(state).toBeNull();
    });

    it('PASSPHRASE_FLOW.SET_STATE with mantainLoadingForState keeps loading true', () => {
        const initialState = {
            state: 'initial' as const,
            id: 'device:1',
            isExisting: true,
            previousState: null,
            loading: true,
        };
        const state = reducer(
            initialState,
            setPassphraseFlowState({
                state: 'exists-enter-passphrase',
                mantainLoadingForState: true,
            }),
        );
        expect(state).toEqual({
            ...initialState,
            state: 'exists-enter-passphrase',
            previousState: 'initial',
            loading: true,
        });
    });

    it('PASSPHRASE_FLOW.SET_STATE without mantainLoadingForState sets loading to false', () => {
        const initialState = {
            state: 'initial' as const,
            id: 'device:1',
            isExisting: true,
            previousState: null,
            loading: true,
        };
        const state = reducer(
            initialState,
            setPassphraseFlowState({ state: 'exists-enter-passphrase' }),
        );
        expect(state).toEqual({
            ...initialState,
            state: 'exists-enter-passphrase',
            previousState: 'initial',
            loading: false,
        });
    });

    it('PASSPHRASE_FLOW.SET_TRANSACTION_LOADING sets loading property', () => {
        const initialState = {
            state: 'initial' as const,
            id: 'device:1',
            isExisting: true,
            previousState: null,
            loading: false,
        };
        const state = reducer(initialState, setPassphraseFlowTransactionLoading({ loading: true }));
        expect(state).toEqual({
            ...initialState,
            loading: true,
        });
    });
});
