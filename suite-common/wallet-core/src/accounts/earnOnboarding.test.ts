import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { accountsActions } from './accountsActions';
import {
    earnOnboardingActions,
    earnOnboardingInitialState,
    getEarnOpportunityKey,
    prepareEarnOnboardingReducer,
    selectIsEarnOnboardingConfirmed,
} from './earnOnboarding';

const reducer = prepareEarnOnboardingReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadEarnOnboarding: mockReducer() },
});

const account = mockWalletAccount({ symbol: 'eth' });
const otherAccount = mockWalletAccount({ symbol: 'eth', deviceState: 'anotherwallet@device:0' });
const opportunity = getEarnOpportunityKey({ type: 'staking', provider: 'everstake' });

describe('earn onboarding', () => {
    it('confirms only the selected account and opportunity and survives serialization', () => {
        const confirmAction = earnOnboardingActions.confirmEarnOnboarding({
            accountKey: account.key,
            opportunity,
        });

        // The second confirmation of the same opportunity must not duplicate the entry.
        let earnOnboarding = reducer(earnOnboardingInitialState, confirmAction);
        earnOnboarding = reducer(earnOnboarding, confirmAction);
        earnOnboarding = JSON.parse(JSON.stringify(earnOnboarding));

        const state = { wallet: { earnOnboarding } };

        expect(earnOnboarding[account.key]).toEqual([opportunity]);
        expect(selectIsEarnOnboardingConfirmed(state, account.key, opportunity)).toBe(true);
        expect(selectIsEarnOnboardingConfirmed(state, account.key, 'yield:another-vault')).toBe(
            false,
        );
        expect(selectIsEarnOnboardingConfirmed(state, otherAccount.key, opportunity)).toBe(false);
    });

    it('removes confirmations together with the account', () => {
        const confirmed = reducer(
            earnOnboardingInitialState,
            earnOnboardingActions.confirmEarnOnboarding({ accountKey: account.key, opportunity }),
        );

        const earnOnboarding = reducer(confirmed, accountsActions.removeAccount([account]));

        const state = { wallet: { earnOnboarding } };

        expect(selectIsEarnOnboardingConfirmed(state, account.key, opportunity)).toBe(false);
    });

    it('normalizes vault addresses and separates providers', () => {
        expect(getEarnOpportunityKey({ type: 'yield', vaultAddress: '0xABC' })).toBe(
            getEarnOpportunityKey({ type: 'yield', vaultAddress: '0xabc' }),
        );
        expect(opportunity).not.toBe(
            getEarnOpportunityKey({ type: 'staking', provider: 'another-provider' }),
        );
    });
});
