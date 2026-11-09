import { useTranslation } from '@suite/intl';
import { TOOLTIP_DELAY_NORMAL, Tooltip } from '@trezor/components';
import { CoinsIcon } from '@trezor/icons';

import { AccountItemBadge } from './AccountItemBadge';

type AccountTokensBadgeProps = {
    tokenCount: number;
};

export const AccountTokensBadge = ({ tokenCount }: AccountTokensBadgeProps) => {
    const { translationString } = useTranslation();
    const label = translationString('TR_ACCOUNT_TOKENS_COUNT', { count: tokenCount });

    return (
        <Tooltip content={label} delayShow={TOOLTIP_DELAY_NORMAL}>
            <div role="img" aria-label={label}>
                <AccountItemBadge icon={CoinsIcon}>+{tokenCount}</AccountItemBadge>
            </div>
        </Tooltip>
    );
};
