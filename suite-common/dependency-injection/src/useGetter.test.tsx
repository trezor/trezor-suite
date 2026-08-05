import React, { type PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { act, renderHook } from '@testing-library/react';

import { type Getter, toGetter } from './toGetter';
import { useGetter } from './useGetter';
import { ServicesProvider } from './useServices';

type TestState = { relayUrl: string; isTorEnabled: boolean; selectedWalletDescriptor: string };

// A minimal store, so the test does not depend on any app state shape.
const createTestStore = () => {
    let state: TestState = {
        relayUrl: 'wss://relay.example.com',
        isTorEnabled: false,
        selectedWalletDescriptor: 'wallet-1',
    };
    const listeners = new Set<() => void>();

    return {
        getState: () => state,
        subscribe: (listener: () => void) => {
            listeners.add(listener);

            return () => listeners.delete(listener);
        },
        dispatch: (action: Partial<TestState>) => {
            state = { ...state, ...action };
            listeners.forEach(listener => listener());

            return action;
        },
    };
};

type RelayUrlDep = { getRelayUrl: Getter<[], string> };
type TorDep = { getIsTorEnabled: Getter<[], boolean> };
type SelectedWalletDep = { getIsSelectedWallet: Getter<[walletDescriptor: string], boolean> };

const selectRelayUrlDep = (services: any): RelayUrlDep => ({ getRelayUrl: services.getRelayUrl });
const selectSelectedWalletDep = (services: any): SelectedWalletDep => ({
    getIsSelectedWallet: services.getIsSelectedWallet,
});
const selectTwoGettersDep = (services: any): RelayUrlDep & TorDep => ({
    getRelayUrl: services.getRelayUrl,
    getIsTorEnabled: services.getIsTorEnabled,
});

const renderUseGetter = <TResult,>(useHook: () => TResult) => {
    const store = createTestStore();
    const renderSpy = jest.fn();
    const services = {
        getRelayUrl: toGetter(store.getState, state => state.relayUrl),
        getIsTorEnabled: toGetter(store.getState, state => state.isTorEnabled),
        getIsSelectedWallet: toGetter(
            store.getState,
            (state: TestState, walletDescriptor: string) =>
                state.selectedWalletDescriptor === walletDescriptor,
        ),
    };

    const wrapper = ({ children }: PropsWithChildren) => (
        <Provider store={store as any}>
            <ServicesProvider services={services}>{children}</ServicesProvider>
        </Provider>
    );

    const rendered = renderHook(
        () => {
            renderSpy();

            return useHook();
        },
        { wrapper },
    );

    return { store, renderSpy, ...rendered };
};

describe(useGetter.name, () => {
    it('returns the current value of the getter', () => {
        const { result } = renderUseGetter(() => useGetter(selectRelayUrlDep));

        expect(result.current).toBe('wss://relay.example.com');
    });

    it('re-renders with the new value when the store changes', () => {
        const { store, result } = renderUseGetter(() => useGetter(selectRelayUrlDep));

        act(() => {
            store.dispatch({ relayUrl: 'wss://other.example.com' });
        });

        expect(result.current).toBe('wss://other.example.com');
    });

    it('does not re-render when an unrelated part of the state changes', () => {
        const { store, renderSpy } = renderUseGetter(() => useGetter(selectRelayUrlDep));
        const rendersBefore = renderSpy.mock.calls.length;

        act(() => {
            store.dispatch({ isTorEnabled: true });
        });

        expect(renderSpy.mock.calls.length).toBe(rendersBefore);
    });

    it('forwards params to the getter', () => {
        const { result } = renderUseGetter(() =>
            useGetter(selectSelectedWalletDep, 'wallet-2' as string),
        );

        expect(result.current).toBe(false);
    });

    it('rejects a dependency holding more than one getter', () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});

        expect(() => renderUseGetter(() => useGetter(selectTwoGettersDep as any))).toThrow(
            'useGetter expects a dependency with exactly one getter, got 2',
        );
    });
});
