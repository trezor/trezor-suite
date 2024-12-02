import { forwardRef, Ref } from 'react';

import styled from 'styled-components';

import { Column, Tooltip, TOOLTIP_DELAY_NORMAL } from '@trezor/components';

import { useDispatch } from 'src/hooks/suite';
import { Account, AccountItemType } from 'src/types/wallet';
import { goto } from 'src/actions/suite/routerActions';
import { NavigationItemBase } from 'src/components/suite/layouts/SuiteLayout/Sidebar/NavigationItem';

import { ExpandedSidebarOnly } from '../../../../suite/layouts/SuiteLayout/Sidebar/ExpandedSidebarOnly';
import { CollapsedSidebarOnly } from '../../../../suite/layouts/SuiteLayout/Sidebar/CollapsedSidebarOnly';
import { AccountRow } from './AccountRow';
import { AccountItemLeft } from './AccountItemLeft';

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
