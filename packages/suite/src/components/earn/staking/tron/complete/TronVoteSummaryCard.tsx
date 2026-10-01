import { Translation } from '@suite/intl';
import { Card, Column, Icon, Row, Text } from '@trezor/components';
import { CheckCircleFilledIcon } from '@trezor/icons';

import { useTronStakeContext } from '../TronStakeContext';
import { TronStakeInfoRow } from '../TronStakeInfoRow';
import { parseVoteCount } from '../utils/voteUtils';
import { TronVoteAllocationTable } from '../vote/TronVoteAllocationTable';

export const TronVoteSummaryCard = () => {
    const { form, representatives } = useTronStakeContext();

    const allocations = form.methods
        .getValues('voteAllocations')
        .filter(({ votes }) => (parseVoteCount(votes) ?? 0) > 0);

    return (
        <Column gap={16} alignItems="stretch">
            <Card type="contrast" paddingType="none">
                <TronStakeInfoRow label={<Translation id="TR_EARN_YIELD_STATUS" />}>
                    <Row alignItems="center" gap={8}>
                        <Icon as={CheckCircleFilledIcon} intent="brand" />
                        <Text typographyStyle="body-md" intent="brand">
                            <Translation id="TR_EARN_YIELD_COMPLETED" />
                        </Text>
                    </Row>
                </TronStakeInfoRow>
            </Card>

            <Card paddingType="none">
                <TronVoteAllocationTable
                    allocations={allocations}
                    representatives={representatives.data}
                />
            </Card>
        </Column>
    );
};
