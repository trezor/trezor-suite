import { Ref, forwardRef } from 'react';

import styled from 'styled-components';

import { BaseCurrencyAmount } from '@suite-common/wallet-types';
import { Column, TOOLTIP_DELAY_NORMAL, Tooltip } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { exhaustive } from '@trezor/type-utils';

import { useGoToWithAnalytics } from 'src/components/suite/layouts/SuiteLayout/PageHeader/useGoToWithAnalytics';
import { NavigationItemBase } from 'src/components/suite/layouts/SuiteLayout/Sidebar/NavigationItem';
import { Account, AccountItemType } from 'src/types/wallet';

import { AccountItemLogo } from './AccountItemLogo/AccountItemLogo';
import { AccountRow } from './AccountRow/AccountRow';
import { CollapsedSidebarOnly } from '../../../../suite/layouts/SuiteLayout/Sidebar/CollapsedSidebarOnly';
import { ExpandedSidebarOnly } from '../../../../suite/layouts/SuiteLayout/Sidebar/ExpandedSidebarOnly';

const CollapsedItem = styled(NavigationItemBase)<{ $isSelected: boolean }>`
    background: ${({ theme, $isSelected }) => $isSelected && theme.backgroundSurfaceElevation1};
    line-height: 0;
    z-index: 0;
    position: relative;

    &:hover {
        z-index: 1;
        position: relative;
        background: ${({ theme, $isSelected }) =>
            !$isSelected && theme.backgroundTertiaryPressedOnElevation0};
    }
`;

function getRoute(type: AccountItemType) {
    switch (type) {
        case 'coin':
            return 'wallet-index';
        case 'staking':
            return 'wallet-staking';
        case 'tokens':
            return 'wallet-tokens';
        default:
            return exhaustive(type);
    }
}

export interface AccountItemProps {
    account: Account;
    // NOTE: disables the default item click behavior
    forceOnlyItemClick?: boolean;
    type: AccountItemType;
    isSelected: boolean;
    isGroupSelected?: boolean;
    formattedBalance: string;
    customFiatValue?: BaseCurrencyAmount;
    isGroup?: boolean;
    tokens?: Account['tokens'];
    dataTestKey?: string;
    isFiatLoading?: boolean;
    onClick?: (account: Account, type: AccountItemType) => void;
}

// Using `forwardRef` to be able to pass `ref` (item) TO parent (Menu/index)
export const AccountItem = forwardRef(
    (
        {
            account,
            forceOnlyItemClick,
            type,
            isSelected,
            isGroupSelected,
            formattedBalance,
            customFiatValue,
            isGroup,
            dataTestKey,
            isFiatLoading,
            onClick,
        }: AccountItemProps,
        ref: Ref<HTMLDivElement>,
    ) => {
        const { accountType, index, symbol } = account;

        const goToWithAnalytics = useGoToWithAnalytics(account);

        const handleHeaderClick = () => {
            onClick?.(account, type);

            // NOTE: disable default behavior useful eg in global send modal - when picking account
            // from which to send
            if (forceOnlyItemClick) {
                return;
            }

            goToWithAnalytics(getRoute(type), {
                params: {
                    symbol,
                    accountIndex: index,
                    accountType,
                },
            });

            if (type === 'staking') {
                analytics.report({
                    type: EventType.StakingNavigate,
                    payload: {
                        action: 'navigate',
                        from: 'sidebar',
                        networkSymbol: symbol,
                    },
                });
            }
        };

        const content = (
            <AccountRow
                isFiatLoading={Boolean(isFiatLoading)}
                isSelected={isSelected}
                isGroup={isGroup}
                isGroupSelected={isGroupSelected}
                handleHeaderClick={handleHeaderClick}
                dataTestKey={dataTestKey}
                type={type}
                account={account}
                ref={ref}
                customFiatValue={customFiatValue}
                formattedBalance={formattedBalance}
            />
        );

        return (
            <>
                <ExpandedSidebarOnly>{content}</ExpandedSidebarOnly>
                <CollapsedSidebarOnly>
                    <Column alignItems="center">
                        <Tooltip
                            delayShow={TOOLTIP_DELAY_NORMAL}
                            cursor="pointer"
                            content={content}
                            placement="right"
                            hasArrow
                        >
                            <CollapsedItem $isSelected={isSelected} onClick={handleHeaderClick}>
                                <AccountItemLogo type={type} account={account} />
                            </CollapsedItem>
                        </Tooltip>
                    </Column>
                </CollapsedSidebarOnly>
            </>
        );
    },
);
