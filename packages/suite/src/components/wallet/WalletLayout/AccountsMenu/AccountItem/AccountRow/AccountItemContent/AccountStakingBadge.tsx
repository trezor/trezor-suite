import { useSelector } from 'react-redux';

import { type TranslationKey, useTranslation } from '@suite/intl';
import {
    type StakingPositionNotice,
    type StakingRootState,
    selectStakingAccountNotice,
} from '@suite-common/earn-staking';
import { type Account } from '@suite-common/wallet-types';
import { type IconComponent, TOOLTIP_DELAY_NORMAL, Tooltip } from '@trezor/components';
import { InfoIcon, PiggyBankIcon, WarningIcon } from '@trezor/icons';

import { AccountItemBadge } from './AccountItemBadge';

type AccountStakingBadgeProps = {
    account: Account;
    isFocused: boolean;
};

type StakingBadgeContent = {
    tooltipId: TranslationKey;
    icon?: IconComponent;
    labelId?: TranslationKey;
    additionalIcon?: IconComponent;
    intent: 'neutral' | 'info' | 'warning';
    voteCount?: string;
};

const getStakingBadgeContent = (
    notice: StakingPositionNotice | null,
    { networkType }: Account,
): StakingBadgeContent => {
    if (notice?.kind === 'outdated-provider') {
        return {
            tooltipId: 'TR_STAKING_REWARDS_REDUCED',
            labelId: 'TR_STAKING_REWARDS_REDUCED',
            additionalIcon: WarningIcon,
            intent: 'warning',
        };
    }

    if (notice?.kind === 'no-stake-pool') {
        return {
            tooltipId: 'TR_STAKING_REWARDS_REDUCED',
            labelId: 'TR_STAKING_REWARDS_REDUCED',
            icon: InfoIcon,
            intent: 'neutral',
        };
    }

    if (notice?.kind === 'external-provider') {
        if (networkType === 'cardano') {
            return {
                tooltipId: 'TR_STAKING_EXTERNAL_POOL',
                labelId: 'TR_STAKING_EXTERNAL_POOL',
                intent: 'info',
            };
        }

        return {
            tooltipId: 'TR_STAKING_DIFFERENT_PROVIDER',
            additionalIcon: InfoIcon,
            intent: 'info',
        };
    }

    if (notice?.kind === 'votes-left') {
        return {
            tooltipId: 'TR_EARN_TRON_VOTES_TO_ALLOCATE',
            labelId: 'TR_EARN_TRON_VOTES_LEFT_BADGE',
            intent: 'info',
            voteCount: notice.count,
        };
    }

    return { tooltipId: 'TR_EARN_STAKING', intent: 'neutral' };
};

export const AccountStakingBadge = ({ account, isFocused }: AccountStakingBadgeProps) => {
    const { translationString } = useTranslation();
    const notice = useSelector((state: StakingRootState) =>
        selectStakingAccountNotice(state, account.key),
    );
    const { tooltipId, labelId, icon, additionalIcon, intent, voteCount } = getStakingBadgeContent(
        notice,
        account,
    );
    const values = voteCount === undefined ? undefined : { count: voteCount };
    const tooltipLabel = translationString(tooltipId, values);
    const tooltipProps = isFocused
        ? { isOpen: true }
        : ({ delayShow: TOOLTIP_DELAY_NORMAL } as const);

    return (
        <Tooltip content={tooltipLabel} minWidth={0} maxWidth="100%" {...tooltipProps}>
            <div
                role="img"
                aria-label={tooltipLabel}
                data-testid="@account-menu/staking/badge"
                style={{ minWidth: 0, maxWidth: '100%' }}
            >
                <AccountItemBadge
                    icon={icon ?? PiggyBankIcon}
                    additionalIcon={additionalIcon}
                    intent={intent}
                >
                    {labelId && translationString(labelId, values)}
                </AccountItemBadge>
            </div>
        </Tooltip>
    );
};
