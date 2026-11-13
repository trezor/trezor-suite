import { Translation } from '@suite/intl';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { Icon, Paragraph, Row } from '@trezor/components';
import { InfoIcon, WarningIcon } from '@trezor/icons';

import { useFormatApy } from '#src/hooks/earn/useFormatApy';

type EarnStakingOutdatedProviderProps = {
    apy: number | null;
    hasNoPool?: boolean;
};

export const EarnStakingOutdatedProvider = ({
    apy,
    hasNoPool = false,
}: EarnStakingOutdatedProviderProps) => {
    const formatApyValue = useFormatApy();
    const intent = hasNoPool ? 'info' : 'warning';

    const providerMessage = isApyAvailable(apy) ? (
        <Translation
            id="TR_EARN_STAKING_DASHBOARD_OUTDATED_PROVIDER"
            values={{ apy: formatApyValue(apy) }}
        />
    ) : (
        <Translation id="TR_EARN_STAKING_DASHBOARD_OUTDATED_PROVIDER_NO_APY" />
    );

    return (
        <Row gap={4}>
            <Icon as={hasNoPool ? InfoIcon : WarningIcon} size={20} intent={intent} />
            <Paragraph typographyStyle="body-sm" intent={intent}>
                {hasNoPool ? <Translation id="TR_STAKING_NO_POOL_TITLE" /> : providerMessage}
            </Paragraph>
        </Row>
    );
};
