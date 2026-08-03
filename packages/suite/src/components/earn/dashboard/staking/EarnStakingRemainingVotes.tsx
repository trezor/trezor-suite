import { Translation } from '@suite/intl';
import { formatTronApr } from '@suite-common/earn-staking-api';
import { Icon, Paragraph, Row } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';

type EarnStakingRemainingVotesProps = {
    apr: number | null;
};

export const EarnStakingRemainingVotes = ({ apr }: EarnStakingRemainingVotesProps) => (
    <Row gap={4}>
        <Icon as={WarningIcon} size={20} intent="warning" />
        <Paragraph typographyStyle="body-sm" intent="warning">
            <Translation
                id="TR_EARN_STAKING_DASHBOARD_REMAINING_VOTES"
                values={{ apr: formatTronApr(apr) }}
            />
        </Paragraph>
    </Row>
);
