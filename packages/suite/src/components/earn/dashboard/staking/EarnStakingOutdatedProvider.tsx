import { Translation } from '@suite/intl';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { Icon, Paragraph, Row } from '@trezor/components';
import { InfoIcon, WarningIcon } from '@trezor/icons';

import { useFormatApy } from '#src/hooks/earn/useFormatApy';

type EarnStakingOutdatedProviderProps = {
    apy: number | null;
    isStakedWithFiveBinaries: boolean;
};

export const EarnStakingOutdatedProvider = ({
    apy,
    isStakedWithFiveBinaries,
}: EarnStakingOutdatedProviderProps) => {
    const formatApyValue = useFormatApy();
    const intent = isStakedWithFiveBinaries ? 'warning' : 'info';

    return (
        <Row gap={4}>
            <Icon
                as={isStakedWithFiveBinaries ? WarningIcon : InfoIcon}
                size={20}
                intent={intent}
            />
            <Paragraph typographyStyle="body-sm" intent={intent}>
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
