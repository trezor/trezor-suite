import React, { type PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { type PayloadAction, configureStore, createSlice } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';

import { type Getter, toGetter } from './toGetter';
import { useGetter } from './useGetter';
import { ServicesProvider } from './useServices';

type TestState = { relayUrl: string; isTorEnabled: boolean; selectedWalletDescriptor: string };

const initialState: TestState = {
    relayUrl: 'wss://relay.example.com',
    isTorEnabled: false,
    selectedWalletDescriptor: 'wallet-1',
};

// A store of its own, so the test does not depend on any app state shape.
const testSlice = createSlice({
    name: 'test',
    initialState,
    reducers: {
        setTestState: (state, { payload }: PayloadAction<Partial<TestState>>) => ({
            ...state,
            ...payload,
        }),
    },
});

const { setTestState } = testSlice.actions;

const createTestStore = () => configureStore({ reducer: testSlice.reducer });

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

const renderUseGetter = <TResult, TProps>(
    useHook: (props: TProps) => TResult,
    initialProps?: TProps,
) => {
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
        <Provider store={store}>
            <ServicesProvider services={services}>{children}</ServicesProvider>
        </Provider>
    );

    const rendered = renderHook(
        (props: TProps) => {
            renderSpy();

            return useHook(props);
        },
        { wrapper, initialProps: initialProps as TProps },
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
            store.dispatch(setTestState({ relayUrl: 'wss://other.example.com' }));
        });

        expect(result.current).toBe('wss://other.example.com');
    });

    it('does not re-render when an unrelated part of the state changes', () => {
        const { store, renderSpy } = renderUseGetter(() => useGetter(selectRelayUrlDep));
        const rendersBefore = renderSpy.mock.calls.length;

        act(() => {
            store.dispatch(setTestState({ isTorEnabled: true }));
        });

        expect(renderSpy.mock.calls.length).toBe(rendersBefore);
    });

    it('forwards params to the getter', () => {
        const { result } = renderUseGetter(() =>
            useGetter(selectSelectedWalletDep, 'wallet-2' as string),
        );

        expect(result.current).toBe(false);
    });

    it('reads the value for the new params when they change', () => {
        const { result, rerender } = renderUseGetter(
            (walletDescriptor: string) => useGetter(selectSelectedWalletDep, walletDescriptor),
            'wallet-2' as string,
        );

        expect(result.current).toBe(false);

        rerender('wallet-1');

        expect(result.current).toBe(true);
    });

    it('keeps watching the value for the params that were last passed', () => {
        const { store, result, rerender } = renderUseGetter(
            (walletDescriptor: string) => useGetter(selectSelectedWalletDep, walletDescriptor),
            'wallet-2' as string,
        );

        rerender('wallet-3');

        act(() => {
            store.dispatch(setTestState({ selectedWalletDescriptor: 'wallet-3' }));
        });

        expect(result.current).toBe(true);
    });

    it('rejects a dependency holding more than one getter', () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});

        expect(() => renderUseGetter(() => useGetter(selectTwoGettersDep as any))).toThrow(
            'useGetter expects a dependency with exactly one getter, got 2',
        );
    });
});
