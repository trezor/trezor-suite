import { Translation } from '@suite/intl';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { Icon, Paragraph, Row } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';

import { useFormatApyValue } from 'src/components/earn/utils/earnApyUtils';

type EarnStakingRemainingVotesProps = {
    apr: number | null;
};

export const EarnStakingRemainingVotes = ({ apr }: EarnStakingRemainingVotesProps) => {
    const formatApyValue = useFormatApyValue();

    return (
        <Row gap={4}>
            <Icon as={WarningIcon} size={20} intent="warning" />
            <Paragraph typographyStyle="body-sm" intent="warning">
                {isApyAvailable(apr) ? (
                    <Translation
                        id="TR_EARN_STAKING_DASHBOARD_REMAINING_VOTES"
                        values={{ apr: formatApyValue(apr) }}
                    />
                ) : (
                    <Translation id="TR_EARN_STAKING_DASHBOARD_REMAINING_VOTES_NO_APR" />
                )}
            </Paragraph>
        </Row>
    );
};
