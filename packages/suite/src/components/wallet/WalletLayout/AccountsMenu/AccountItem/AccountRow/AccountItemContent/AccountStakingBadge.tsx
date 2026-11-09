import { type TranslationKey, useTranslation } from '@suite/intl';
import {
    getTronAvailableVotingPower,
    isCardanoStakedWithEverstake,
    isCardanoStakedWithFiveBinaries,
    selectCardanoPoolsInfo,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { TOOLTIP_DELAY_NORMAL, Tooltip } from '@trezor/components';
import { PiggyBankIcon, WarningIcon } from '@trezor/icons';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

import { AccountItemBadge } from './AccountItemBadge';

type AccountStakingBadgeProps = {
    account: Account;
};

const getStakingWarningLabel = (
    account: Account,
    cardanoStakingPools: ReturnType<typeof selectCardanoPoolsInfo>,
): TranslationKey | undefined => {
    if (isCardanoStakedWithFiveBinaries(account)) return 'TR_STAKING_REWARDS_REDUCED';
    if (
        account.networkType === 'cardano' &&
        !isCardanoStakedWithEverstake(account, cardanoStakingPools)
    ) {
        return 'TR_STAKING_DIFFERENT_PROVIDER';
    }
    if (account.symbol === 'trx' && new BigNumber(getTronAvailableVotingPower(account)).gt(0)) {
        return 'TR_EARN_STAKING_DASHBOARD_REMAINING_VOTES_NO_APR';
    }
};

export const AccountStakingBadge = ({ account }: AccountStakingBadgeProps) => {
    const { translationString } = useTranslation();
    const cardanoStakingPools = useSelector(selectCardanoPoolsInfo);
    const warningLabel = getStakingWarningLabel(account, cardanoStakingPools);
    const label = warningLabel ?? 'TR_EARN_STAKING';
    const translatedLabel = translationString(label);

    return (
        <Tooltip content={translatedLabel} delayShow={TOOLTIP_DELAY_NORMAL}>
            <div role="img" aria-label={translatedLabel} data-testid="@account-menu/staking/badge">
                <AccountItemBadge
                    icon={PiggyBankIcon}
                    additionalIcon={warningLabel ? WarningIcon : undefined}
                    intent={warningLabel ? 'warning' : 'neutral'}
                />
            </div>
        </Tooltip>
    );
};
