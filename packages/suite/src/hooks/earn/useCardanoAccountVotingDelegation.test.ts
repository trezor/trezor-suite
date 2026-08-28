import { renderHook } from '@testing-library/react';

import { configureMockStore } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { CARDANO_EVERSTAKE_DREP } from '@suite-common/wallet-constants';
import { stakeActions, stakeInitialState } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { renderHookWithProviders } from 'src/support/test-utils/hooksHelper';

import {
    useCardanoAccountVotingDelegation,
    useSeededCardanoVotingDelegation,
} from './useCardanoAccountVotingDelegation';
import { mockInitialAppState } from '../../../mocks/mockInitialAppState';

const CUSTOM_DREP_ID = 'drep1ectemlv45xsnvenfgkhwsxncfvxev4qllj7x5w6vlfc7kmd9zcs';
const PREDEFINED_DREP_ID = 'drep_always_abstain';

const createCardanoAccount = (
    drepId: string | null,
    isStakingActive = true,
    key = 'ada-account-key',
): Account =>
    ({
        key,
        index: 0,
        symbol: asNetworkSymbol('ada'),
        networkType: 'cardano',
        misc: {
            staking: {
                isActive: isStakingActive,
                drep: drepId === null ? null : { drep_id: drepId },
            },
        },
    }) as unknown as Account;

describe('useCardanoAccountVotingDelegation', () => {
    it('returns undefined for an account with no vote delegation, so the options keep their own default', () => {
        const { result } = renderHook(() =>
            useCardanoAccountVotingDelegation(createCardanoAccount(null)),
        );

        expect(result.current).toBeUndefined();
    });

    it('keeps a custom DRep without re-delegating to it', () => {
        const { result } = renderHook(() =>
            useCardanoAccountVotingDelegation(createCardanoAccount(CUSTOM_DREP_ID)),
        );

        expect(result.current).toEqual({ type: 'current' });
    });

    it('keeps the Everstake DRep without re-delegating to it', () => {
        const { result } = renderHook(() =>
            useCardanoAccountVotingDelegation(createCardanoAccount(CARDANO_EVERSTAKE_DREP.bech32)),
        );

        expect(result.current).toEqual({ type: 'current' });
    });

    it('keeps a predefined DRep, which no vote delegation certificate can express', () => {
        const { result } = renderHook(() =>
            useCardanoAccountVotingDelegation(createCardanoAccount(PREDEFINED_DREP_ID)),
        );

        expect(result.current).toEqual({ type: 'current' });
    });

    it('returns undefined for an unregistered account, whose reported delegation is stale', () => {
        const { result } = renderHook(() =>
            useCardanoAccountVotingDelegation(createCardanoAccount(CUSTOM_DREP_ID, false)),
        );

        expect(result.current).toBeUndefined();
    });

    it('returns undefined for a non-cardano account', () => {
        const ethereumAccount = {
            networkType: 'ethereum',
            misc: { nonce: '0' },
        } as unknown as Account;

        const { result } = renderHook(() => useCardanoAccountVotingDelegation(ethereumAccount));

        expect(result.current).toBeUndefined();
    });

    it('keeps the same reference across re-renders, so the options effect does not re-run', () => {
        const { result, rerender } = renderHook(() =>
            useCardanoAccountVotingDelegation(createCardanoAccount(CUSTOM_DREP_ID)),
        );
        const firstResult = result.current;

        rerender();

        expect(result.current).toBe(firstResult);
    });
});

describe('useSeededCardanoVotingDelegation', () => {
    const renderSeededHook = (account: Account) => {
        const store = configureMockStore({
            extra: undefined,
            preloadedState: {
                ...mockInitialAppState,
                wallet: { ...mockInitialAppState.wallet, stake: stakeInitialState },
            },
            serializableCheck: { ignoredActions: [] },
        });

        const { rerender } = renderHookWithProviders(
            store,
            {},
            ({ account: renderedAccount }: { account: Account }) =>
                useSeededCardanoVotingDelegation(renderedAccount),
            { initialProps: { account } },
        );

        return { store, rerender };
    };

    it('seeds the selection with the delegation the account already has', () => {
        const { store } = renderSeededHook(createCardanoAccount(CUSTOM_DREP_ID));

        expect(store.getActions()).toEqual([
            stakeActions.setVotingDelegationOption({ type: 'current' }),
        ]);
    });

    it('seeds an account only once, so a later backend update cannot overwrite a user selection', () => {
        const { store, rerender } = renderSeededHook(createCardanoAccount(null));

        rerender({ account: createCardanoAccount(CUSTOM_DREP_ID) });

        expect(store.getActions()).toHaveLength(1);
    });

    it('seeds again for a different account', () => {
        const { store, rerender } = renderSeededHook(createCardanoAccount(null));

        rerender({ account: createCardanoAccount(CUSTOM_DREP_ID, true, 'other-ada-account-key') });

        expect(store.getActions()).toHaveLength(2);
    });
});
