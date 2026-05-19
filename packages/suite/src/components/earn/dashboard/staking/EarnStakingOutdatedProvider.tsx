import { Translation } from '@suite/intl';
import { Icon, Paragraph, Row } from '@trezor/components';

import { formatApyValue } from 'src/components/earn/utils/earnApyUtils';

type EarnStakingOutdatedProviderProps = {
    apy: number | null;
};

export const EarnStakingOutdatedProvider = ({ apy }: EarnStakingOutdatedProviderProps) => (
    <Row gap={4}>
        <Icon name="warning" size={24} intent="warning" />
        <Paragraph typographyStyle="body-md" intent="warning">
            <Translation
                id="TR_EARN_STAKING_DASHBOARD_OUTDATED_PROVIDER"
                values={{ apy: formatApyValue(apy) }}
            />
        </Paragraph>
    </Row>
);
