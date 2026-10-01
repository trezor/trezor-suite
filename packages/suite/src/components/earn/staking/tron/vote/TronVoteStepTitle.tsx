import { useWatch } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { Column, Row, Text } from '@trezor/components';

import { TronVoteRemainingVotes } from './TronVoteRemainingVotes';
import { useTronStakeContext } from '../TronStakeContext';

interface TronVoteStepTitleProps {
    isActive: boolean;
}

export const TronVoteStepTitle = ({ isActive }: TronVoteStepTitleProps) => {
    const { form } = useTronStakeContext();

    const allocations = useWatch({ control: form.methods.control, name: 'voteAllocations' });

    const hasAllocations = allocations.length > 0;

    return (
        <Row gap={8} width="100%" justifyContent="space-between" alignItems="flex-end">
            <Column gap={2}>
                <Text
                    typographyStyle="body-xs"
                    intent="neutral"
                    priority="secondary"
                    case="uppercase"
                >
                    <Translation id="TR_STEP_OF_TOTAL" values={{ index: 2, total: 2 }} />
                </Text>

                <Translation
                    id={hasAllocations ? 'TR_EARN_TRON_VOTE' : 'TR_EARN_TRON_VOTE_STEP_TITLE'}
                />
            </Column>

            {isActive && <TronVoteRemainingVotes />}
        </Row>
    );
};
