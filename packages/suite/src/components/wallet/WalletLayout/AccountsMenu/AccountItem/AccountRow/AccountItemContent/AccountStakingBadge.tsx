import { useTranslation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { TOOLTIP_DELAY_NORMAL, Tooltip } from '@trezor/components';
import { PiggyBankIcon, WarningIcon } from '@trezor/icons';

import { useSelector } from '#src/hooks/suite/useSelector';

import { AccountItemBadge } from './AccountItemBadge';
import { selectAccountStakingBadgeWarningLabel } from './accountStakingBadgeSelectors';

type AccountStakingBadgeProps = {
    account: Account;
    isFocused: boolean;
};

export const AccountStakingBadge = ({ account, isFocused }: AccountStakingBadgeProps) => {
    const { translationString } = useTranslation();
    const warningLabel = useSelector(state =>
        selectAccountStakingBadgeWarningLabel(state, account.key),
    );
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
