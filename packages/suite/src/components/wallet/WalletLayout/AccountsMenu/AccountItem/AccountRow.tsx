import { forwardRef } from 'react';

import styled from 'styled-components';

import { AccountType, NetworkSymbol } from '@suite-common/wallet-config';
import { spacingsPx, typography } from '@trezor/theme';

import { Account, AccountItemType } from '../../../../../types/wallet';
import { Left } from './AccountItem';
import { NavigationItemBase } from '../../../../suite/layouts/SuiteLayout/Sidebar/NavigationItem';
import { AccountItemLeft } from './AccountItemLeft';
import { AccountItemContent } from './AccountItemContent';

type AccountRowProps = {
    isSelected: boolean;
    isGroup?: boolean;
    isGroupSelected?: boolean;
    handleHeaderClick: () => void;
    dataTestKey?: string;
    type: AccountItemType;
    symbol: NetworkSymbol;
    account: Account;
    customFiatValue?: string;
    accountLabel?: string;
    accountType: AccountType;
    index?: number;
    formattedBalance: string;
};

const Wrapper = styled(NavigationItemBase)<{
    $isSelected: boolean;
    $isGroupSelected?: boolean;
    $isGroup?: boolean;
}>`
    background: ${({ theme, $isSelected }) => $isSelected && theme.backgroundSurfaceElevation1};
    gap: ${spacingsPx.md};
    display: flex;
    justify-content: space-between;
    color: ${({ theme }) => theme.textSubdued};
    ${typography.hint};

    &:hover {
        background: ${({ theme, $isSelected }) =>
            !$isSelected && theme.backgroundTertiaryPressedOnElevation0};
    }
`;

export const AccountRow = forwardRef<HTMLDivElement, AccountRowProps>(
    (
        {
            isSelected,
            isGroup,
            isGroupSelected,
            handleHeaderClick,
            dataTestKey,
            type,
            symbol,
            account,
            customFiatValue,
            accountLabel,
            accountType,
            index,
            formattedBalance,
        },
        ref,
    ) => {
        return (
            <Wrapper
                $isSelected={isSelected}
                $isGroup={isGroup}
                $isGroupSelected={isGroupSelected}
                ref={ref}
                onClick={handleHeaderClick}
                data-testid={dataTestKey}
                tabIndex={0}
            >
                <Left>
                    <AccountItemLeft type={type} symbol={symbol} account={account} />
                </Left>
                <AccountItemContent
                    customFiatValue={customFiatValue}
                    account={account}
                    type={type}
                    accountLabel={accountLabel}
                    accountType={accountType}
                    symbol={symbol}
                    index={index}
                    formattedBalance={formattedBalance}
                    dataTestKey={dataTestKey}
                />
            </Wrapper>
        );
    },
);
