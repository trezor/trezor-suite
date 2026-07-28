import { combineReducers } from '@reduxjs/toolkit';

import {
    configureMockStore,
    extraDependenciesCommonMock,
    renderHookWithStoreProvider,
} from '@suite-common/test-utils';

import { messageSystemInitialState, prepareMessageSystemReducer } from './messageSystemReducer';
import { type MessageSystemState } from './messageSystemTypes';
import { useMessageSystemEarnDashboard } from './useMessageSystemEarnDashboard';

const messageSystemReducer = prepareMessageSystemReducer(extraDependenciesCommonMock);

const stateWithMessages = {
    ...messageSystemInitialState,
    config: {
        version: 1,
        timestamp: '2023-01-01',
        sequence: 1,
        actions: [
            {
                message: {
                    id: 'yieldDashboardDisabledMsg',
                    priority: 1,
                    dismissible: false,
                    category: ['feature'],
                    variant: 'warning',
                    content: { en: 'Yield dashboard disabled', cs: 'Yield dashboard vypnutý' },
                    feature: [{ domain: 'earn.dashboard.yield', flag: false }],
                },
            },
            {
                message: {
                    id: 'stakingDashboardContextMsg',
                    priority: 1,
                    dismissible: false,
                    category: ['context'],
                    variant: 'info',
                    content: { en: 'Staking dashboard notice' },
                    context: { domain: 'earn.dashboard.staking' },
                },
            },
        ],
        experiments: [],
    },
    validMessages: {
        banner: [],
        context: ['stakingDashboardContextMsg'],
        modal: [],
        feature: ['yieldDashboardDisabledMsg'],
    },
} as unknown as MessageSystemState;

const createStore = (state: MessageSystemState = stateWithMessages) =>
    configureMockStore({
        extra: {},
        reducer: combineReducers({ messageSystem: messageSystemReducer }),
        preloadedState: { messageSystem: state } as { messageSystem: MessageSystemState },
    });

const renderHook = (props: Parameters<typeof useMessageSystemEarnDashboard>[0]) =>
    renderHookWithStoreProvider(() => useMessageSystemEarnDashboard(props), {
        store: createStore(),
    });

describe('useMessageSystemEarnDashboard', () => {
    it('returns disabled state with feature message content and variant', () => {
        const { result } = renderHook({ type: 'yield', locale: 'en' });

        expect(result.current).toMatchObject({
            isDisabled: true,
            content: 'Yield dashboard disabled',
            variant: 'warning',
        });
    });

    it('returns localized feature message content', () => {
        const { result } = renderHook({ type: 'yield', locale: 'cs' });

        expect(result.current.content).toBe('Yield dashboard vypnutý');
    });

    it('falls back to context message content when no feature message is active', () => {
        const { result } = renderHook({ type: 'staking', locale: 'en' });

        expect(result.current).toMatchObject({
            isDisabled: false,
            content: 'Staking dashboard notice',
            variant: 'info',
        });
    });

    it('returns not disabled without content when no messages are configured', () => {
        const store = createStore(messageSystemInitialState);
        const { result } = renderHookWithStoreProvider(
            () => useMessageSystemEarnDashboard({ type: 'yield', locale: 'en' }),
            { store },
        );

        expect(result.current).toMatchObject({
            isDisabled: false,
            content: undefined,
            variant: undefined,
        });
    });
});
