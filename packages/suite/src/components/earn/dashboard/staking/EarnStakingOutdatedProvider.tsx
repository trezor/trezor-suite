import { Translation } from '@suite/intl';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { Icon, Paragraph, Row } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';

import { useFormatApy } from 'src/hooks/earn/useFormatApy';

type EarnStakingOutdatedProviderProps = {
    apy: number | null;
};

export const EarnStakingOutdatedProvider = ({ apy }: EarnStakingOutdatedProviderProps) => {
    const formatApyValue = useFormatApy();

    return (
        <Row gap={4}>
            <Icon as={WarningIcon} size={20} intent="warning" />
            <Paragraph typographyStyle="body-sm" intent="warning">
                {isApyAvailable(apy) ? (
                    <Translation
                        id="TR_EARN_STAKING_DASHBOARD_OUTDATED_PROVIDER"
                        values={{ apy: formatApyValue(apy) }}
                    />
                ) : (
                    <Translation id="TR_EARN_STAKING_DASHBOARD_OUTDATED_PROVIDER_NO_APY" />
                )}
            </Paragraph>
        </Row>
    );
};
