import '@suite-common/test-utils/globalOverrides';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { CARDANO_EVERSTAKE_DREP } from '@suite-common/wallet-constants';
import { DEFAULT_VOTING_OPTION, stakeActions, stakeInitialState } from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';

import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { VotingDelegations } from './VotingDelegations';
import { mockInitialAppState } from '../../../../../../mocks/mockInitialAppState';

const CUSTOM_DREP_ID = 'drep1ectemlv45xsnvenfgkhwsxncfvxev4qllj7x5w6vlfc7kmd9zcs';
const PREDEFINED_DREP_ID = 'drep_always_abstain';
const ACCOUNT_KEY = 'ada-account-key' as AccountKey;

const createCardanoAccount = (drepId: string | null): Account =>
    ({
        key: ACCOUNT_KEY,
        index: 0,
        symbol: asNetworkSymbol('ada'),
        networkType: 'cardano',
        misc: {
            staking: { isActive: true, drep: drepId === null ? null : { drep_id: drepId } },
        },
    }) as unknown as Account;

const renderVotingDelegations = (account: Account) => {
    const root = createTestCompositionRoot({
        extra: { services: {} },
        preloadedState: {
            ...mockInitialAppState,
            wallet: { ...mockInitialAppState.wallet, stake: stakeInitialState },
        },
        serializableCheck: { ignoredActions: [] },
    });

    renderWithProviders(root, <VotingDelegations account={account} />);

    return root;
};

describe('VotingDelegations', () => {
    it('keeps a custom DRep the account already votes for instead of resetting it to Everstake', () => {
        const root = renderVotingDelegations(createCardanoAccount(CUSTOM_DREP_ID));

        expect(root.services.getActions()).toContainEqual(
            stakeActions.setAccountVotingDelegation({
                accountKey: ACCOUNT_KEY,
                option: { type: 'current' },
            }),
        );
    });

    it('keeps the Everstake DRep without re-delegating to it', () => {
        const root = renderVotingDelegations(createCardanoAccount(CARDANO_EVERSTAKE_DREP.bech32));

        expect(root.services.getActions()).toContainEqual(
            stakeActions.setAccountVotingDelegation({
                accountKey: ACCOUNT_KEY,
                option: { type: 'current' },
            }),
        );
    });

    it('keeps a predefined DRep, which no vote delegation certificate can express', () => {
        const root = renderVotingDelegations(createCardanoAccount(PREDEFINED_DREP_ID));

        expect(root.services.getActions()).toContainEqual(
            stakeActions.setAccountVotingDelegation({
                accountKey: ACCOUNT_KEY,
                option: { type: 'current' },
            }),
        );
    });

    it('offers Everstake to an account with no vote delegation', () => {
        const root = renderVotingDelegations(createCardanoAccount(null));

        expect(root.services.getActions()).toContainEqual(
            stakeActions.setAccountVotingDelegation({
                accountKey: ACCOUNT_KEY,
                option: DEFAULT_VOTING_OPTION,
            }),
        );
    });
});
