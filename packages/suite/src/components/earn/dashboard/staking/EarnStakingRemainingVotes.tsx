import { Translation } from '@suite/intl';
import { Icon, Paragraph, Row } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';

type EarnStakingRemainingVotesProps = {
    count: string;
};

export const EarnStakingRemainingVotes = ({ count }: EarnStakingRemainingVotesProps) => (
    <Row gap={4}>
        <Icon as={InfoIcon} size={20} intent="info" />
        <Paragraph typographyStyle="body-sm" intent="info">
            <Translation id="TR_EARN_UNASSIGNED_VOTES" values={{ count }} />
        </Paragraph>
    </Row>
);
