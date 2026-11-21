import { Form } from '@suite/form';
import { Translation } from '@suite/intl';
import { Banner, Column } from '@trezor/components';

import { useMessageSystemStaking } from '#src/hooks/suite/useMessageSystemStaking';

import { TronVoteAllocationSection } from './TronVoteAllocationSection';
import { TronVoteSubmitButton } from './TronVoteSubmitButton';
import { useTronStakeContext } from '../TronStakeContext';
import { TronStakeFees } from '../TronStakeFees';
import { TronStakePendingTransaction } from '../TronStakePendingTransaction';

export const TronVoteStep = () => {
    const { form, actions, account } = useTronStakeContext();
    const { error } = actions;

    const { isVotingDisabled, votingMessageContent } = useMessageSystemStaking(account.symbol);

    const { formState } = form.methods;

    return (
        <Form form={form.methods} formState={formState}>
            <Column gap={16}>
                {isVotingDisabled && <Banner intent="warning" description={votingMessageContent} />}

                <TronVoteAllocationSection />

                <TronStakeFees />

                {error && (
                    <Banner
                        intent="warning"
                        description={<Translation id="TR_EARN_TRON_SUBMIT_ERROR" />}
                        data-testid="@staking/tron-vote/submit-error"
                    />
                )}

                <TronVoteSubmitButton />

                <TronStakePendingTransaction
                    title={<Translation id="TR_EARN_TRON_PENDING_VOTE" />}
                />
            </Column>
        </Form>
    );
};
