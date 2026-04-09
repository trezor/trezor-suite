import { combineReducers } from '@reduxjs/toolkit';

import {
    configureMockStore,
    extraDependenciesCommonMock,
    renderHookWithStoreProvider,
} from '@suite-common/test-utils';

import { messageSystemInitialState, prepareMessageSystemReducer } from '../messageSystemReducer';
import { type MessageSystemState } from '../messageSystemTypes';
import { useMessageSystemStaking } from '../useMessageSystemStaking';

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
                    id: 'stakeDisabledMsg',
                    priority: 1,
                    dismissible: false,
                    category: ['feature'],
                    content: { en: 'Staking disabled', cs: 'Staking vypnutý' },
                    feature: [
                        { domain: 'eth.staking.stake', flag: false },
                        { domain: 'eth.staking.unstake', flag: false },
                    ],
                },
            },
            {
                message: {
                    id: 'claimDisabledMsg',
                    priority: 1,
                    dismissible: false,
                    category: ['feature'],
                    content: { en: 'Claiming disabled' },
                    feature: [{ domain: 'eth.staking.claim', flag: false }],
                },
            },
        ],
        experiments: [],
    },
    validMessages: {
        banner: [],
        context: [],
        modal: [],
        feature: ['stakeDisabledMsg', 'claimDisabledMsg'],
    },
} as unknown as MessageSystemState;

const createStore = (state: MessageSystemState = stateWithDisabledFeatures) =>
    configureMockStore({
        extra: {},
        reducer: combineReducers({ messageSystem: messageSystemReducer }),
        preloadedState: { messageSystem: state } as { messageSystem: MessageSystemState },
    });

const renderHook = (
    networkSymbol: Parameters<typeof useMessageSystemStaking>[0]['networkSymbol'],
    locale = 'en',
) =>
    renderHookWithStoreProvider(() => useMessageSystemStaking({ networkSymbol, locale }), {
        store: createStore(),
    });

describe('useMessageSystemStaking', () => {
    it('returns disabled states and messages when features are disabled', () => {
        const { result } = renderHook('eth');

        expect(result.current).toMatchObject({
            isStakingDisabled: true,
            isUnstakingDisabled: true,
            isClaimingDisabled: true,
            stakingMessageContent: 'Staking disabled',
            unstakingMessageContent: 'Staking disabled',
            claimingMessageContent: 'Claiming disabled',
        });
    });

    it('returns localized message content', () => {
        const { result } = renderHook('eth', 'cs');

        expect(result.current.stakingMessageContent).toBe('Staking vypnutý');
    });

    it.each([undefined, null, 'btc' as const])(
        'returns undefined for unsupported networkSymbol: %s',
        networkSymbol => {
            const { result } = renderHook(networkSymbol);

            expect(result.current.isStakingDisabled).toBeUndefined();
            expect(result.current.isUnstakingDisabled).toBeUndefined();
            expect(result.current.isClaimingDisabled).toBeUndefined();
        },
    );

    it('returns not disabled when no feature messages configured', () => {
        const store = createStore(messageSystemInitialState);
        const { result } = renderHookWithStoreProvider(
            () => useMessageSystemStaking({ networkSymbol: 'eth', locale: 'en' }),
            { store },
        );

        expect(result.current).toMatchObject({
            isStakingDisabled: false,
            isUnstakingDisabled: false,
            isClaimingDisabled: false,
            stakingMessageContent: undefined,
        });
    });
});
