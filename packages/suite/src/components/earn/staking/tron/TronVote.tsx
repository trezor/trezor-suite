import { useEffect } from 'react';

import { Translation } from '@suite/intl';
import { tronStakeActions } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Column } from '@trezor/components';

import { useDispatch } from 'src/hooks/suite';

import { TronStakeContext } from './TronStakeContext';
import { TronStakeComplete } from './complete/TronStakeComplete';
import { TronVoteSummaryCard } from './complete/TronVoteSummaryCard';
import { useTronStakeFlow } from './hooks/useTronStakeFlow';
import { TronVoteForm } from './vote/TronVoteForm';

interface TronVoteProps {
    account: Account;
}

export const TronVote = ({ account }: TronVoteProps) => {
    const dispatch = useDispatch();
    const context = useTronStakeFlow({ account });
    const { step } = context.actions;

    useEffect(() => {
        if (step === 'freeze') {
            dispatch(tronStakeActions.goToStep({ accountKey: account.key, step: 'vote' }));
        }
    }, [account.key, step, dispatch]);

    return (
        <TronStakeContext.Provider value={context}>
            <Column alignItems="center">
                <Column gap={24} width="100%" maxWidth={500}>
                    {step === 'complete' ? (
                        <TronStakeComplete
                            heading={<Translation id="TR_EARN_TRON_VOTE_COMPLETE" />}
                            description={
                                <Translation id="TR_EARN_TRON_VOTE_COMPLETE_DESCRIPTION" />
                            }
                        >
                            <TronVoteSummaryCard />
                        </TronStakeComplete>
                    ) : (
                        <TronVoteForm />
                    )}
                </Column>
            </Column>
        </TronStakeContext.Provider>
    );
};
