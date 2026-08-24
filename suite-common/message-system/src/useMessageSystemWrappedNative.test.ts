import { combineReducers } from '@reduxjs/toolkit';

import { mockActionType } from '@suite-common/redux-utils/mocks';
import { createTestStore, renderHookWithStoreProvider } from '@suite-common/test-utils';

import { messageSystemInitialState, prepareMessageSystemReducer } from './messageSystemReducer';
import { type MessageSystemState } from './messageSystemTypes';
import { useMessageSystemWrappedNative } from './useMessageSystemWrappedNative';

const messageSystemReducer = prepareMessageSystemReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

const stateWithDisabledWrap = {
    ...messageSystemInitialState,
    config: {
        version: 1,
        timestamp: '2023-01-01',
        sequence: 1,
        actions: [
            {
                message: {
                    id: 'wrapDisabledMsg',
                    priority: 1,
                    dismissible: false,
                    category: ['feature'],
                    variant: 'critical',
                    content: { en: 'Wrapping disabled', cs: 'Wrapování vypnuté' },
                    feature: [{ domain: 'earn.wrappedNative.wrap', flag: false }],
                },
            },
        ],
        experiments: [],
    },
    validMessages: {
        banner: [],
        context: [],
        modal: [],
        feature: ['wrapDisabledMsg'],
    },
} as unknown as MessageSystemState;

const createStore = (state: MessageSystemState = stateWithDisabledWrap) =>
    createTestStore({
        extra: undefined,
        reducer: combineReducers({ messageSystem: messageSystemReducer }),
        preloadedState: { messageSystem: state } as { messageSystem: MessageSystemState },
    });

const renderHook = (props: Parameters<typeof useMessageSystemWrappedNative>[0]) =>
    renderHookWithStoreProvider(() => useMessageSystemWrappedNative(props), {
        store: createStore(),
    });

describe('useMessageSystemWrappedNative', () => {
    it('returns disabled state, message content and variant when wrapping is disabled', () => {
        const { result } = renderHook({ type: 'wrap', locale: 'en' });

        expect(result.current).toMatchObject({
            isDisabled: true,
            content: 'Wrapping disabled',
            variant: 'critical',
        });
    });

    it('returns localized message content', () => {
        const { result } = renderHook({ type: 'wrap', locale: 'cs' });

        expect(result.current.content).toBe('Wrapování vypnuté');
    });

    it('does not disable unwrapping when only wrapping is disabled', () => {
        const { result } = renderHook({ type: 'unwrap', locale: 'en' });

        expect(result.current).toMatchObject({
            isDisabled: false,
            content: undefined,
            variant: undefined,
        });
    });

    it('returns not disabled when no feature messages are configured', () => {
        const store = createStore(messageSystemInitialState);
        const { result } = renderHookWithStoreProvider(
            () => useMessageSystemWrappedNative({ type: 'wrap', locale: 'en' }),
            { store },
        );

        expect(result.current).toMatchObject({
            isDisabled: false,
            content: undefined,
            variant: undefined,
        });
    });
});
