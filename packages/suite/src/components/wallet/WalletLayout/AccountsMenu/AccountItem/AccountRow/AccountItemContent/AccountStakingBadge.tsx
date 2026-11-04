import { shallowEqual, useSelector } from 'react-redux';

import { type TranslationKey, useTranslation } from '@suite/intl';
import {
    type StakingRootState,
    formatStakingAmount,
    selectHasStakingAccountWarning,
    selectIsStakingAccountDelegatedOutside,
    selectIsStakingAccountWithoutPool,
    selectStakingAccountPositionDetails,
} from '@suite-common/earn-staking';
import { type Account } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
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

const selectStakingBadgeContent = (
    state: StakingRootState,
    { key, networkType, symbol }: Account,
): StakingBadgeContent => {
    if (selectHasStakingAccountWarning(state, key, 'outdated-provider')) {
        return {
            tooltipId: 'TR_STAKING_REWARDS_REDUCED',
            labelId: 'TR_STAKING_REWARDS_REDUCED',
            additionalIcon: WarningIcon,
            intent: 'warning',
        };
    }

    if (selectIsStakingAccountWithoutPool(state, key)) {
        return {
            tooltipId: 'TR_STAKING_REWARDS_REDUCED',
            labelId: 'TR_STAKING_REWARDS_REDUCED',
            icon: InfoIcon,
            intent: 'neutral',
        };
    }

    if (selectIsStakingAccountDelegatedOutside(state, key)) {
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

    const votes = selectStakingAccountPositionDetails(
        state,
        key,
        'tron-staking',
    )?.unallocatedVotingPower;
    if (votes !== undefined && isPositiveBalance(votes)) {
        return {
            tooltipId: 'TR_EARN_TRON_VOTES_TO_ALLOCATE',
            labelId: 'TR_EARN_TRON_VOTES_LEFT_BADGE',
            intent: 'info',
            voteCount: formatStakingAmount({ amount: votes, networkSymbol: symbol }),
        };
    }

    return { tooltipId: 'TR_EARN_STAKING', intent: 'neutral' };
};

export const AccountStakingBadge = ({ account, isFocused }: AccountStakingBadgeProps) => {
    const { translationString } = useTranslation();
    const { tooltipId, labelId, icon, additionalIcon, intent, voteCount } = useSelector(
        (state: StakingRootState) => selectStakingBadgeContent(state, account),
        shallowEqual,
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
