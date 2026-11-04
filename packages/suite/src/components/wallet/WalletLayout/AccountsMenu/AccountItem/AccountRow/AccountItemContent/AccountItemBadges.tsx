import { Translation, useTranslation } from '@suite/intl';
import { selectIsStakingAccountWithoutPool } from '@suite-common/earn-staking';
import { type Account } from '@suite-common/wallet-types';
import { getAccountTypeName } from '@suite-common/wallet-utils';
import { Row, TOOLTIP_DELAY_NORMAL, Tooltip } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';

import { useSelector } from '#src/hooks/suite/useSelector';

import { AccountItemBadge } from './AccountItemBadge';
import { AccountStakingBadge } from './AccountStakingBadge';
import { AccountTokensBadge } from './AccountTokensBadge';

const NoStakingRewardsBadge = ({ isFocused }: { isFocused: boolean }) => {
    const { translationString } = useTranslation();
    const label = translationString('TR_STAKING_REWARDS_REDUCED');
    const tooltipProps = isFocused
        ? { isOpen: true }
        : ({ delayShow: TOOLTIP_DELAY_NORMAL } as const);

    return (
        <Tooltip content={label} minWidth={0} maxWidth="100%" {...tooltipProps}>
            <div
                role="img"
                aria-label={label}
                data-testid="@account-menu/staking/badge"
                style={{ minWidth: 0, maxWidth: '100%' }}
            >
                <AccountItemBadge icon={InfoIcon}>{label}</AccountItemBadge>
            </div>
        </Tooltip>
    );
};

type AccountItemBadgesProps = {
    account: Account;
    tokenCount: number;
    hasStaking: boolean;
    isFocused: boolean;
};

export const AccountItemBadges = ({
    account,
    tokenCount,
    hasStaking,
    isFocused,
}: AccountItemBadgesProps) => {
    const hasNoPool = useSelector(state => selectIsStakingAccountWithoutPool(state, account.key));
    const accountTypeName = account.accountType === 'normal' ? null : getAccountTypeName(account);

    if (!accountTypeName && !hasStaking && tokenCount === 0) return null;

    return (
        <Row gap={4} minWidth={0} maxWidth="100%" flexWrap="wrap">
            {accountTypeName && (
                <AccountItemBadge>
                    <Translation id={accountTypeName} />
                </AccountItemBadge>
            )}
            {hasStaking &&
                (hasNoPool ? (
                    <NoStakingRewardsBadge isFocused={isFocused} />
                ) : (
                    <AccountStakingBadge account={account} isFocused={isFocused} />
                ))}
            {tokenCount > 0 && <AccountTokensBadge tokenCount={tokenCount} />}
        </Row>
    );
};
