import '@suite-common/test-utils/globalOverrides';

import { configureMockStore } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { CARDANO_EVERSTAKE_DREP } from '@suite-common/wallet-constants';
import { DEFAULT_VOTING_OPTION, stakeActions, stakeInitialState } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { VotingDelegations } from './VotingDelegations';
import { mockInitialAppState } from '../../../../../../mocks/mockInitialAppState';

const CUSTOM_DREP_ID = 'drep1ectemlv45xsnvenfgkhwsxncfvxev4qllj7x5w6vlfc7kmd9zcs';
const PREDEFINED_DREP_ID = 'drep_always_abstain';

const createCardanoAccount = (drepId: string | null): Account =>
    ({
        key: 'ada-account-key',
        index: 0,
        symbol: asNetworkSymbol('ada'),
        networkType: 'cardano',
        misc: {
            staking: { isActive: true, drep: drepId === null ? null : { drep_id: drepId } },
        },
    }) as unknown as Account;

const renderVotingDelegations = (account: Account) => {
    const store = configureMockStore({
        extra: undefined,
        preloadedState: {
            ...mockInitialAppState,
            wallet: { ...mockInitialAppState.wallet, stake: stakeInitialState },
        },
        serializableCheck: { ignoredActions: [] },
    });

    renderWithProviders(store, {}, <VotingDelegations account={account} />);

    return store;
};

describe('VotingDelegations', () => {
    it('keeps a custom DRep the account already votes for instead of resetting it to Everstake', () => {
        const store = renderVotingDelegations(createCardanoAccount(CUSTOM_DREP_ID));

        expect(store.getActions()).toContainEqual(
            stakeActions.setVotingDelegationOption({ type: 'current' }),
        );
    });

    it('keeps the Everstake DRep without re-delegating to it', () => {
        const store = renderVotingDelegations(createCardanoAccount(CARDANO_EVERSTAKE_DREP.bech32));

        expect(store.getActions()).toContainEqual(
            stakeActions.setVotingDelegationOption({ type: 'current' }),
        );
    });

    it('keeps a predefined DRep, which no vote delegation certificate can express', () => {
        const store = renderVotingDelegations(createCardanoAccount(PREDEFINED_DREP_ID));

        expect(store.getActions()).toContainEqual(
            stakeActions.setVotingDelegationOption({ type: 'current' }),
        );
    });

    it('offers Everstake to an account with no vote delegation', () => {
        const store = renderVotingDelegations(createCardanoAccount(null));

        expect(store.getActions()).toContainEqual(
            stakeActions.setVotingDelegationOption(DEFAULT_VOTING_OPTION),
        );
    });
});
