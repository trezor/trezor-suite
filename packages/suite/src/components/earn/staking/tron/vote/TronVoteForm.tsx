import { Form } from '@suite/form';
import { Translation } from '@suite/intl';
import { Banner, Column, Row, Text } from '@trezor/components';

import { useMessageSystemStaking } from '#src/hooks/suite/useMessageSystemStaking';

import { TronVoteAllocationSection } from './TronVoteAllocationSection';
import { TronVoteRemainingVotes } from './TronVoteRemainingVotes';
import { TronVoteSubmitButton } from './TronVoteSubmitButton';
import { useTronStakeContext } from '../TronStakeContext';
import { TronStakeFees } from '../TronStakeFees';
import { TronStakePendingTransaction } from '../TronStakePendingTransaction';

export const TronVoteForm = () => {
    const { account, form, actions } = useTronStakeContext();
    const { error } = actions;

    const { isVotingDisabled, votingMessageContent } = useMessageSystemStaking(account.symbol);

    const { formState } = form.methods;

    return (
        <Form form={form.methods} formState={formState}>
            <Column gap={16}>
                <Row gap={8} width="100%" justifyContent="space-between" alignItems="flex-end">
                    <Text typographyStyle="headline-md" data-testid="@staking/tron-vote/title">
                        <Translation id="TR_EARN_TRON_CHANGE_REPRESENTATIVE" />
                    </Text>

                    <TronVoteRemainingVotes />
                </Row>

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
