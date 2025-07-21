import { forwardRef } from 'react';

import styled from 'styled-components';

import { BaseCurrencyAmount } from '@suite-common/wallet-utils';
import { spacingsPx, typography } from '@trezor/theme';

import { Left } from './AccountItem';
import { AccountItemContent } from './AccountItemContent';
import { AccountItemLeft } from './AccountItemLeft';
import { Account, AccountItemType } from '../../../../../types/wallet';
import { NavigationItemBase } from '../../../../suite/layouts/SuiteLayout/Sidebar/NavigationItem';

type AccountRowProps = {
    isSelected: boolean;
    isGroup?: boolean;
    isGroupSelected?: boolean;
    handleHeaderClick: () => void;
    dataTestKey?: string;
    type: AccountItemType;
    account: Account;
    customFiatValue?: BaseCurrencyAmount;
    formattedBalance: string;
    isFiatLoading?: boolean;
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
            account,
            customFiatValue,
            formattedBalance,
            isFiatLoading,
        },
        ref,
    ) => (
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
                <AccountItemLeft type={type} symbol={account.symbol} account={account} />
            </Left>
            <AccountItemContent
                customFiatValue={customFiatValue}
                account={account}
                type={type}
                formattedBalance={formattedBalance}
                dataTestKey={dataTestKey}
                isFiatLoading={Boolean(isFiatLoading)}
            />
        </Wrapper>
    ),
);
