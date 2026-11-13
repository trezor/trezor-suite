import { type PropsWithChildren } from 'react';

import { render, screen } from '@testing-library/react';

import { CARDANO_EVERSTAKE_DREP } from '@suite-common/wallet-constants';
import { mockCardanoStakingAccount } from '@suite-common/wallet-types/mocks';

import { CurrentVotingPreference } from './CurrentVotingPreference';

jest.mock('@suite/intl', () => ({ Translation: ({ id }: { id: string }) => id }));
jest.mock('@trezor/components', () => {
    const Container = ({ children }: PropsWithChildren) => children;

    return {
        Card: Container,
        Column: Container,
        Row: Container,
        Text: ({ children }: PropsWithChildren) => <span>{children}</span>,
        IconCircle: () => null,
    };
});

describe('current Cardano voting preference', () => {
    it.each([
        ['drep_always_no_confidence', 'TR_STAKING_VOTE_NO_CONFIDENCE'],
        ['drep_always_abstain', 'TR_STAKING_VOTE_ABSTAIN'],
        [CARDANO_EVERSTAKE_DREP.bech32, 'Everstake'],
        ['unknown-drep', 'TR_STAKE_PROVIDER_UNKNOWN'],
        [null, 'TR_STAKE_NONE'],
    ] as const)('labels %s as %s', (drepId, label) => {
        const account = mockCardanoStakingAccount('everstake');
        account.misc = {
            ...account.misc,
            staking: {
                ...account.misc.staking,
                drep: drepId
                    ? {
                          drep_id: drepId,
                          hex: '',
                          amount: '0',
                          active: true,
                          active_epoch: null,
                          has_script: false,
                      }
                    : null,
            },
        };

        render(<CurrentVotingPreference account={account} />);

        expect(screen.getByText(label)).toBeInTheDocument();
    });
});
