import styled from 'styled-components';

import { Account } from '@suite-common/wallet-types';
import { BadgeSize, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useDefaultAccountLabel } from 'src/hooks/suite';

import { AccountTypeBadge } from './AccountTypeBadge';

const TabularNums = styled.span`
    font-variant-numeric: tabular-nums;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
`;

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
        <Row gap={spacings.sm}>
            {accountLabel ? (
                <TabularNums>{accountLabel}</TabularNums>
            ) : (
                getDefaultAccountLabel({ accountType, symbol, index })
            )}
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
