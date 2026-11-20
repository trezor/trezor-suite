import { Translation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { getAccountTypeName } from '@suite-common/wallet-utils';
import { Row } from '@trezor/components';

import { AccountItemBadge } from './AccountItemBadge';
import { AccountStakingBadge } from './AccountStakingBadge';
import { AccountTokensBadge } from './AccountTokensBadge';

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
    const accountTypeName = account.accountType === 'normal' ? null : getAccountTypeName(account);

    if (!accountTypeName && !hasStaking && tokenCount === 0) return null;

    return (
        <Row gap={4} minWidth={0} maxWidth="100%" flexWrap="wrap">
            {accountTypeName && (
                <AccountItemBadge>
                    <Translation id={accountTypeName} />
                </AccountItemBadge>
            )}
            {hasStaking && <AccountStakingBadge account={account} isFocused={isFocused} />}
            {tokenCount > 0 && <AccountTokensBadge tokenCount={tokenCount} />}
        </Row>
    );
};
