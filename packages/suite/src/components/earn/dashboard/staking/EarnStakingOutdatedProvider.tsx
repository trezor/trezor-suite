import { Translation } from '@suite/intl';
import { selectHasStakingAccountWarning } from '@suite-common/earn-staking';
import { type Account } from '@suite-common/wallet-types';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { Icon, Paragraph, Row } from '@trezor/components';
import { InfoIcon, WarningIcon } from '@trezor/icons';

import { useFormatApy } from '#src/hooks/earn/useFormatApy';
import { useSelector } from '#src/hooks/suite/useSelector';

type EarnStakingOutdatedProviderProps = {
    apy: number | null;
    account: Account;
};

export const EarnStakingOutdatedProvider = ({ apy, account }: EarnStakingOutdatedProviderProps) => {
    const formatApyValue = useFormatApy();

    const hasNoPool = useSelector(state =>
        selectHasStakingAccountWarning(state, account.key, 'no-stake-pool'),
    );

    if (hasNoPool) {
        return (
            <Row gap={4}>
                <Icon as={InfoIcon} size={20} intent="info" />
                <Paragraph typographyStyle="body-sm" intent="info">
                    <Translation id="TR_STAKING_NO_POOL_TITLE" />
                </Paragraph>
            </Row>
        );
    }

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
