import styled from 'styled-components';

import { Account } from '@suite-common/wallet-types';
import { BadgeSize } from '@trezor/components';

import { useDefaultAccountLabel } from 'src/hooks/suite';

import { AccountTypeBadge } from './AccountTypeBadge';
import { ContentFlex, useIsContentBelowBreakpoint } from '../../support/suite/ContentFlex';

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
    const isContentBelowBreakpoint = useIsContentBelowBreakpoint();

    return (
        <ContentFlex gap={isContentBelowBreakpoint ? 4 : 12} alignItems="flex-start">
            {accountLabel ? (
                <TabularNums>{accountLabel}</TabularNums>
            ) : (
                <span>{getDefaultAccountLabel({ accountType, symbol, index })}</span>
            )}
            {showAccountTypeBadge && (
                <AccountTypeBadge
                    accountType={accountType}
                    size={accountTypeBadgeSize}
                    path={path}
                    networkType={networkType}
                />
            )}
        </ContentFlex>
    );
};
