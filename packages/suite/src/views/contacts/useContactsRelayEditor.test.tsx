import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';

import {
    MAX_CONTACTS_RELAY_URLS,
    prepareSuiteSettingsReducer,
    selectContactsRelayUrls,
    suiteSettingsInitialState,
} from '@suite/settings';
import { extraDependenciesCommonMock } from '@suite-common/test-utils';

import { useContactsRelayEditor } from './useContactsRelayEditor';

const renderRelayEditor = (contactsRelayUrls: string[]) => {
    const store = configureStore({
        reducer: { suiteSettings: prepareSuiteSettingsReducer(extraDependenciesCommonMock) },
        preloadedState: { suiteSettings: { ...suiteSettingsInitialState, contactsRelayUrls } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
        <Provider store={store}>{children}</Provider>
    );

    return { store, ...renderHook(() => useContactsRelayEditor(), { wrapper }) };
};

describe('useContactsRelayEditor', () => {
    it('adds a valid relay', () => {
        const { result, store } = renderRelayEditor([]);

        act(() => result.current.setDraft(' wss://relay.example.com '));

        expect(result.current.canAddRelay).toBe(true);

        act(() => result.current.addRelay());

        expect(selectContactsRelayUrls(store.getState())).toEqual(['wss://relay.example.com']);
    });

    it('reports another spelling of a listed relay as a duplicate', () => {
        const { result } = renderRelayEditor(['wss://relay.example.com']);

        act(() => result.current.setDraft('WSS://Relay.Example.com/'));

        expect(result.current.draftErrorId).toBe('TR_CONTACTS_RELAYS_DUPLICATE');
        expect(result.current.canAddRelay).toBe(false);
    });

    it('reports a full relay list instead of dropping the new relay', () => {
        const { result } = renderRelayEditor(
            Array.from(
                { length: MAX_CONTACTS_RELAY_URLS },
                (_, index) => `wss://relay${index}.example.com`,
            ),
        );

        act(() => result.current.setDraft('wss://another.example.com'));

        expect(result.current.draftErrorId).toBe('TR_CONTACTS_RELAYS_LIMIT');
        expect(result.current.canAddRelay).toBe(false);
    });
});
