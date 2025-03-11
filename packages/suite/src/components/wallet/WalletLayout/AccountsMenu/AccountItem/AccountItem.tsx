import { Ref, forwardRef } from 'react';

import styled from 'styled-components';

import { Column, TOOLTIP_DELAY_NORMAL, Tooltip } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { NavigationItemBase } from 'src/components/suite/layouts/SuiteLayout/Sidebar/NavigationItem';
import { useDispatch } from 'src/hooks/suite';
import { Account, AccountItemType } from 'src/types/wallet';

import { AccountItemLeft } from './AccountItemLeft';
import { AccountRow } from './AccountRow';
import { CollapsedSidebarOnly } from '../../../../suite/layouts/SuiteLayout/Sidebar/CollapsedSidebarOnly';
import { ExpandedSidebarOnly } from '../../../../suite/layouts/SuiteLayout/Sidebar/ExpandedSidebarOnly';

export const CollapsedItem = styled(NavigationItemBase)<{ $isSelected: boolean }>`
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
export const Left = styled.div`
    position: relative;
`;

interface AccountItemProps {
    account: Account;
    type: AccountItemType;
    accountLabel?: string;
    isSelected: boolean;
    isGroupSelected?: boolean;
    formattedBalance: string;
    customFiatValue?: string;
    isGroup?: boolean;
    tokens?: Account['tokens'];
    dataTestKey?: string;
    isFiatLoading?: boolean;
    onClick?: () => void;
}

// Using `forwardRef` to be able to pass `ref` (item) TO parent (Menu/index)
export const AccountItem = forwardRef(
    (
        {
            account,
            type,
            accountLabel,
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
        const dispatch = useDispatch();

        const { accountType, index, symbol } = account;

        const accountRouteParams = {
            symbol,
            accountIndex: index,
            accountType,
        };

        const getRoute = () => {
            switch (type) {
                case 'coin':
                    return 'wallet-index';
                case 'staking':
                    return 'wallet-staking';
                case 'tokens':
                    return 'wallet-tokens';
            }
        };

        const handleHeaderClick = () => {
            onClick?.();
            dispatch(goto(getRoute(), { params: accountRouteParams }));
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
                symbol={symbol}
                account={account}
                ref={ref}
                customFiatValue={customFiatValue}
                accountLabel={accountLabel}
                accountType={accountType}
                index={index}
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
                                <AccountItemLeft type={type} symbol={symbol} account={account} />
                            </CollapsedItem>
                        </Tooltip>
                    </Column>
                </CollapsedSidebarOnly>
            </>
        );
    },
);
