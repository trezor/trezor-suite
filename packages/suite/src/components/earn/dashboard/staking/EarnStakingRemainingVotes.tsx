import { Translation } from '@suite/intl';
import { formatTronApr } from '@suite-common/earn-staking-api';
import { Icon, Paragraph, Row } from '@trezor/components';

type EarnStakingRemainingVotesProps = {
    apr: number | null;
};

export const EarnStakingRemainingVotes = ({ apr }: EarnStakingRemainingVotesProps) => (
    <Row gap={4}>
        <Icon name="warning" size={24} intent="warning" />
        <Paragraph typographyStyle="body-md" intent="warning">
            <Translation
                id="TR_EARN_STAKING_DASHBOARD_REMAINING_VOTES"
                values={{ apr: formatTronApr(apr) }}
            />
        </Paragraph>
    </Row>
);
