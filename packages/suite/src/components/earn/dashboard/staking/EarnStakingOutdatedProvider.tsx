import { Translation } from '@suite/intl';
import {
    selectHasStakingAccountWarning,
    selectIsStakingAccountWithoutPool,
} from '@suite-common/earn-staking';
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
    const hasOutdatedProvider = useSelector(state =>
        selectHasStakingAccountWarning(state, account.key, 'outdated-provider'),
    );
    const intent = hasOutdatedProvider ? 'warning' : 'info';

    const hasNoPool = useSelector(state => selectIsStakingAccountWithoutPool(state, account.key));

    const description = isApyAvailable(apy) ? (
        <Translation
            id="TR_EARN_STAKING_DASHBOARD_OUTDATED_PROVIDER"
            values={{ apy: formatApyValue(apy) }}
        />
    ) : (
        <Translation id="TR_EARN_STAKING_DASHBOARD_OUTDATED_PROVIDER_NO_APY" />
    );

    return (
        <Row gap={4}>
            <Icon as={hasOutdatedProvider ? WarningIcon : InfoIcon} size={20} intent={intent} />
            <Paragraph typographyStyle="body-sm" intent={intent}>
                {hasNoPool ? <Translation id="TR_STAKING_NO_POOL_TITLE" /> : description}
            </Paragraph>
        </Row>
    );
};
