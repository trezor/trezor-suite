import { Translation } from '@suite/intl';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { Icon, Paragraph, Row } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';

import { useFormatApy } from '#src/hooks/earn/useFormatApy';

type EarnStakingRemainingVotesProps = {
    apr: number | null;
    count: string;
};

export const EarnStakingRemainingVotes = ({ apr, count }: EarnStakingRemainingVotesProps) => {
    const formatApyValue = useFormatApy();

    return (
        <Row gap={4}>
            <Icon as={InfoIcon} size={20} intent="info" />
            <Paragraph typographyStyle="body-sm" intent="info">
                {isApyAvailable(apr) ? (
                    <Translation
                        id="TR_EARN_UNASSIGNED_VOTES_APR"
                        values={{ count, apr: formatApyValue(apr) }}
                    />
                ) : (
                    <Translation id="TR_EARN_UNASSIGNED_VOTES" values={{ count }} />
                )}
            </Paragraph>
        </Row>
    );
};
