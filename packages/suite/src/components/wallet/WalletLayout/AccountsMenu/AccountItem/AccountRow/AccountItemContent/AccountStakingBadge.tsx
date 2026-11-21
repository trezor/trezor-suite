import { type TranslationKey, useTranslation } from '@suite/intl';
import {
    type StakingRootState,
    selectHasStakingAccountWarning,
    selectIsStakingAccountDelegatedOutside,
    selectStakingAccountPositionDetails,
} from '@suite-common/earn-staking';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { TOOLTIP_DELAY_NORMAL, Tooltip } from '@trezor/components';
import { PiggyBankIcon, WarningIcon } from '@trezor/icons';

import { useSelector } from '#src/hooks/suite/useSelector';

import { AccountItemBadge } from './AccountItemBadge';

type AccountStakingBadgeProps = {
    account: Account;
    isFocused: boolean;
};

// The most pressing warning of the account's position, in the order the badge showed them.
const selectStakingWarningLabel = (
    state: StakingRootState,
    accountKey: AccountKey,
): TranslationKey | null => {
    if (selectHasStakingAccountWarning(state, accountKey, 'outdated-provider')) {
        return 'TR_STAKING_REWARDS_REDUCED';
    }

    if (selectIsStakingAccountDelegatedOutside(state, accountKey)) {
        return 'TR_STAKING_DIFFERENT_PROVIDER';
    }

    const tronStaking = selectStakingAccountPositionDetails(state, accountKey, 'tron-staking');

    if (tronStaking !== null && isPositiveBalance(tronStaking.unallocatedVotingPower)) {
        return 'TR_EARN_STAKING_DASHBOARD_REMAINING_VOTES_NO_APR';
    }

    return null;
};

export const AccountStakingBadge = ({ account, isFocused }: AccountStakingBadgeProps) => {
    const { translationString } = useTranslation();
    const warningLabel = useSelector(state => selectStakingWarningLabel(state, account.key));
    const label = warningLabel ?? 'TR_EARN_STAKING';
    const translatedLabel = translationString(label);
    const tooltipProps = isFocused
        ? { isOpen: true }
        : ({ delayShow: TOOLTIP_DELAY_NORMAL } as const);

    return (
        <Tooltip content={translatedLabel} minWidth={0} maxWidth="100%" {...tooltipProps}>
            <div
                role="img"
                aria-label={translatedLabel}
                data-testid="@account-menu/staking/badge"
                style={{ minWidth: 0, maxWidth: '100%' }}
            >
                <AccountItemBadge
                    icon={PiggyBankIcon}
                    additionalIcon={warningLabel === null ? undefined : WarningIcon}
                    intent={warningLabel === null ? 'neutral' : 'warning'}
                >
                    {warningLabel === 'TR_STAKING_REWARDS_REDUCED' ? translatedLabel : undefined}
                </AccountItemBadge>
            </div>
        </Tooltip>
    );
};
