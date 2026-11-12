import { type TranslationKey, useTranslation } from '@suite/intl';
import {
    getTronAvailableVotingPower,
    isCardanoStakedOutsideEverstake,
    isCardanoStakedWithFiveBinaries,
    selectCardanoPoolsInfo,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { TOOLTIP_DELAY_NORMAL, Tooltip } from '@trezor/components';
import { InfoIcon, PiggyBankIcon, WarningIcon } from '@trezor/icons';
import { BigNumber } from '@trezor/utils';

import { useSelector } from '#src/hooks/suite';

import { AccountItemBadge } from './AccountItemBadge';

type AccountStakingBadgeProps = {
    account: Account;
    isFocused: boolean;
};

const getStakingNoticeLabel = (
    account: Account,
    cardanoStakingPools: ReturnType<typeof selectCardanoPoolsInfo>,
): TranslationKey | undefined => {
    if (isCardanoStakedWithFiveBinaries(account)) return 'TR_STAKING_REWARDS_REDUCED';
    if (isCardanoStakedOutsideEverstake(account, cardanoStakingPools)) {
        return 'TR_STAKING_DIFFERENT_PROVIDER';
    }
    if (account.symbol === 'trx' && new BigNumber(getTronAvailableVotingPower(account)).gt(0)) {
        return 'TR_EARN_STAKING_DASHBOARD_REMAINING_VOTES_NO_APR';
    }
};

export const AccountStakingBadge = ({ account, isFocused }: AccountStakingBadgeProps) => {
    const { translationString } = useTranslation();
    const cardanoStakingPools = useSelector(selectCardanoPoolsInfo);
    const noticeLabel = getStakingNoticeLabel(account, cardanoStakingPools);
    const label = noticeLabel ?? 'TR_EARN_STAKING';
    const isReducedRewards = noticeLabel === 'TR_STAKING_REWARDS_REDUCED';
    const noticeIntent = isReducedRewards ? 'warning' : 'info';
    const noticeIcon = isReducedRewards ? WarningIcon : InfoIcon;
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
                    additionalIcon={noticeLabel ? noticeIcon : undefined}
                    intent={noticeLabel ? noticeIntent : 'neutral'}
                >
                    {isReducedRewards ? translatedLabel : undefined}
                </AccountItemBadge>
            </div>
        </Tooltip>
    );
};
