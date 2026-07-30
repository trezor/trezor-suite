import { combineReducers } from '@reduxjs/toolkit';

import {
    configureMockStore,
    extraDependenciesCommonMock,
    renderHookWithStoreProvider,
} from '@suite-common/test-utils';

import { messageSystemInitialState, prepareMessageSystemReducer } from './messageSystemReducer';
import { type MessageSystemState } from './messageSystemTypes';
import { useMessageSystemWrappedNative } from './useMessageSystemWrappedNative';

const messageSystemReducer = prepareMessageSystemReducer(extraDependenciesCommonMock);

const stateWithDisabledFeatures = {
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
                    variant: 'warning',
                    category: ['feature'],
                    content: { en: 'Wrapping disabled', cs: 'Wrapování vypnuté' },
                    feature: [{ domain: 'earn.wrap', flag: false }],
                },
            },
            {
                message: {
                    id: 'unwrapDisabledMsg',
                    priority: 1,
                    dismissible: false,
                    variant: 'critical',
                    category: ['feature'],
                    content: { en: 'Unwrapping disabled' },
                    feature: [{ domain: 'earn.unwrap', flag: false }],
                },
            },
        ],
        experiments: [],
    },
    validMessages: {
        banner: [],
        context: [],
        modal: [],
        feature: ['wrapDisabledMsg', 'unwrapDisabledMsg'],
    },
} as unknown as MessageSystemState;

const createStore = (state: MessageSystemState = stateWithDisabledFeatures) =>
    configureMockStore({
        extra: {},
        reducer: combineReducers({ messageSystem: messageSystemReducer }),
        preloadedState: { messageSystem: state } as { messageSystem: MessageSystemState },
    });

const renderHook = (locale = 'en') =>
    renderHookWithStoreProvider(() => useMessageSystemWrappedNative({ locale }), {
        store: createStore(),
    });

describe('useMessageSystemWrappedNative', () => {
    it('returns disabled states, messages and variants when features are disabled', () => {
        const { result } = renderHook();

        expect(result.current).toMatchObject({
            isWrapDisabled: true,
            isUnwrapDisabled: true,
            wrapMessageContent: 'Wrapping disabled',
            unwrapMessageContent: 'Unwrapping disabled',
            wrapVariant: 'warning',
            unwrapVariant: 'critical',
        });
    });

    it('returns localized message content', () => {
        const { result } = renderHook('cs');

        expect(result.current.wrapMessageContent).toBe('Wrapování vypnuté');
    });

    it('returns not disabled when no feature messages configured', () => {
        const store = createStore(messageSystemInitialState);
        const { result } = renderHookWithStoreProvider(
            () => useMessageSystemWrappedNative({ locale: 'en' }),
            { store },
        );

        expect(result.current).toMatchObject({
            isWrapDisabled: false,
            isUnwrapDisabled: false,
            wrapMessageContent: undefined,
            unwrapMessageContent: undefined,
            wrapVariant: undefined,
            unwrapVariant: undefined,
        });
    });
});
