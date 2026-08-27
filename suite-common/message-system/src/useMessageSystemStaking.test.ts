import { combineReducers } from '@reduxjs/toolkit';

import { mockActionType } from '@suite-common/redux-utils/mocks';
import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { messageSystemInitialState, prepareMessageSystemReducer } from './messageSystemReducer';
import { type MessageSystemState } from './messageSystemTypes';
import { useMessageSystemStaking } from './useMessageSystemStaking';

const ethSymbol = asNetworkSymbol('eth');
const adaSymbol = asNetworkSymbol('ada');

const messageSystemReducer = prepareMessageSystemReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

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
            {
                message: {
                    id: 'adaVoteDisabledMsg',
                    priority: 1,
                    dismissible: false,
                    category: ['feature'],
                    content: { en: 'Change delegate disabled' },
                    feature: [{ domain: 'ada.staking.vote', flag: false }],
                },
            },
        ],
        experiments: [],
    },
    validMessages: {
        banner: [],
        context: [],
        modal: [],
        feature: ['stakeDisabledMsg', 'claimDisabledMsg', 'adaVoteDisabledMsg'],
    },
} as unknown as MessageSystemState;

const createStore = (state: MessageSystemState = stateWithDisabledFeatures) =>
    configureMockStore({
        extra: undefined,
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
        const { result } = renderHook(ethSymbol);

        expect(result.current).toMatchObject({
            isStakingDisabled: true,
            isUnstakingDisabled: true,
            isClaimingDisabled: true,
            stakingMessageContent: 'Staking disabled',
            unstakingMessageContent: 'Staking disabled',
            claimingMessageContent: 'Claiming disabled',
        });
    });

    it('returns disabled state and message for ada change-delegate (vote) feature', () => {
        const { result } = renderHook(adaSymbol);

        expect(result.current).toMatchObject({
            isVotingDisabled: true,
            votingMessageContent: 'Change delegate disabled',
        });
    });

    it('returns undefined voting state for networks without a vote feature key', () => {
        const { result } = renderHook(ethSymbol);

        expect(result.current.isVotingDisabled).toBeUndefined();
        expect(result.current.votingMessageContent).toBeUndefined();
    });

    it('returns localized message content', () => {
        const { result } = renderHook(ethSymbol, 'cs');

        expect(result.current.stakingMessageContent).toBe('Staking vypnutý');
    });

    it.each([undefined, null, asNetworkSymbol('btc')])(
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
            () =>
                useMessageSystemStaking({
                    networkSymbol: ethSymbol,
                    locale: 'en',
                }),
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
