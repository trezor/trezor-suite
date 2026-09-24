import { Translation } from '@suite/intl';
import { Icon, Paragraph, Row } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';

import { useFormatApyValue } from 'src/components/earn/utils/earnApyUtils';

type EarnStakingOutdatedProviderProps = {
    apy: number | null;
};

export const EarnStakingOutdatedProvider = ({ apy }: EarnStakingOutdatedProviderProps) => {
    const formatApyValue = useFormatApyValue();

    return (
        <Row gap={4}>
            <Icon as={WarningIcon} size={20} intent="warning" />
            <Paragraph typographyStyle="body-sm" intent="warning">
                <Translation
                    id="TR_EARN_STAKING_DASHBOARD_OUTDATED_PROVIDER"
                    values={{ apy: formatApyValue(apy) }}
                />
            </Paragraph>
        </Row>
    );
};
