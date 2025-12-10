import { forwardRef } from 'react';

import styled from 'styled-components';

import { BaseCurrencyAmount } from '@suite-common/wallet-types';
import { spacingsPx, typography } from '@trezor/theme';

import { NavigationItemBase } from 'src/components/suite/layouts/SuiteLayout/Sidebar/NavigationItem';
import { type Account, type AccountItemType } from 'src/types/wallet';

import { AccountItemContent } from './AccountItemContent';
import { AccountItemLogo } from '../AccountItemLogo/AccountItemLogo';

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

const IconWrapper = styled.div`
    position: relative;
`;

export type AccountRowProps = {
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
            <IconWrapper>
                <AccountItemLogo type={type} account={account} />
            </IconWrapper>
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
