import { forwardRef } from 'react';

import styled from 'styled-components';

import { TokenAddress } from '@suite-common/wallet-types';
import { BaseCurrencyAmount } from '@suite-common/wallet-utils';
import { spacingsPx, typography } from '@trezor/theme';

import { TokensWithRates } from 'src/utils/wallet/tokenUtils';

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
    tokens?: TokensWithRates[];
    isTokensExpanded?: boolean;
    onAccountContentClick?: (tokenAddress?: TokenAddress) => void;
    onTokensClick?: () => void;
};

const Wrapper = styled(NavigationItemBase)<{
    $isSelected: boolean;
    $isGroupSelected?: boolean;
    $isGroup?: boolean;
}>`
    background: ${({ theme, $isSelected }) => $isSelected && theme.backgroundSurfaceElevation1};
    gap: ${spacingsPx.md};
    display: flex;
    align-items: start;
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
            isTokensExpanded,
            handleHeaderClick,
            dataTestKey,
            type,
            account,
            customFiatValue,
            formattedBalance,
            isFiatLoading,
            tokens,
            onTokensClick,
            onAccountContentClick,
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
                <AccountItemLeft
                    type={type}
                    account={account}
                    tokens={tokens ?? []}
                    onClick={onTokensClick}
                />
            </Left>
            <AccountItemContent
                customFiatValue={customFiatValue}
                account={account}
                type={type}
                formattedBalance={formattedBalance}
                dataTestKey={dataTestKey}
                isFiatLoading={Boolean(isFiatLoading)}
                tokens={tokens}
                isTokensExpanded={isTokensExpanded}
                onAccountContentClick={onAccountContentClick}
            />
        </Wrapper>
    ),
);
