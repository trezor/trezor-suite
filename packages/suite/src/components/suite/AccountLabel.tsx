import { Account } from '@suite-common/wallet-types';
import { BadgeSize, Row, Text } from '@trezor/components';

import { useDefaultAccountLabel } from 'src/hooks/suite';

import { AccountTypeBadge } from './AccountTypeBadge';

interface AccountLabelProps {
    showAccountTypeBadge?: boolean;
    accountTypeBadgeSize?: BadgeSize;
    account: Account;
}

export const AccountLabel = ({
    showAccountTypeBadge,
    accountTypeBadgeSize = 'medium',
    account,
}: AccountLabelProps) => {
    const { getDefaultAccountLabel } = useDefaultAccountLabel();
    const { symbol, accountType, index, path, networkType, accountLabel } = account;

    return (
        <Row gap={12} overflow="hidden">
            <Text ellipsisLineCount={1}>
                {accountLabel
                    ? accountLabel
                    : getDefaultAccountLabel({ accountType, symbol, index })}
            </Text>
            {showAccountTypeBadge && (
                <AccountTypeBadge
                    accountType={accountType}
                    size={accountTypeBadgeSize}
                    path={path}
                    networkType={networkType}
                />
            )}
        </Row>
    );
};
