import { Route } from '@suite-common/suite-types';
import { Account } from '@suite-common/wallet-types';
import { Button, Dropdown } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { ReactNode } from 'react';
import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { OverflowItem, OverflowItems } from 'src/components/suite/OverflowItems';
import { useDispatch } from 'src/hooks/suite';
import styled from 'styled-components';

const StyledOverflowItems = styled(OverflowItems)`
    gap: 12px;
`;

const StyledDropdown = styled(Dropdown)<{ isDisabled: boolean }>`
    background: ${({ isDisabled, theme }) => (isDisabled ? theme.BG_GREY : theme.BG_SECONDARY)};
    width: 38px;
    height: 38px;
    border-radius: 8px;
    margin-right: 0px;
    flex-shrink: 0;

    > :first-child {
        width: 100%;
        height: 100%;

        :hover {
            background: ${({ isDisabled, theme }) => !isDisabled && theme.BG_SECONDARY_HOVER};
        }
    }
`;

interface TradeBoxMenuProps {
    account: Account;
}

export const TradeBoxMenu = ({ account }: TradeBoxMenuProps) => {
    const dispatch = useDispatch();

    const menuItems: (OverflowItem & {
        route: Route['name'];
        type: 'exchange' | 'buy' | 'sell' | 'spend';
        title: ReactNode;
    })[] = [
        {
            removeOrder: 3,
            route: 'wallet-coinmarket-buy',
            type: 'buy',
            title: <Translation id="TR_NAV_BUY" />,
        },
        {
            removeOrder: 1,
            route: 'wallet-coinmarket-sell',
            type: 'sell',
            title: <Translation id="TR_NAV_SELL" />,
        },
        {
            removeOrder: 2,
            route: 'wallet-coinmarket-exchange',
            type: 'exchange',
            title: <Translation id="TR_NAV_EXCHANGE" />,
        },
    ];

    return (
        <StyledOverflowItems
            items={menuItems}
            minVisibleItems={1}
            visibleItemRenderer={item => (
                <Button
                    key={item.route}
                    variant="secondary"
                    onClick={() => {
                        analytics.report({
                            type: EventType.AccountsTradeboxButton,
                            payload: {
                                symbol: account.symbol,
                                type: item.type,
                            },
                        });
                        dispatch(goto(item.route, { preserveParams: true }));
                    }}
                    data-test={`@coinmarket/menu/${item.route}`}
                >
                    {item.title}
                </Button>
            )}
            overflowRenderer={items => (
                <StyledDropdown
                    alignMenu="right"
                    isDisabled={false}
                    data-test="@wallet/menu/extra-dropdown"
                    items={[
                        {
                            key: 'extra',
                            options: items.map(item => ({
                                key: item.route,
                                callback: () =>
                                    dispatch(goto(item.route, { preserveParams: true })),
                                label: item.title,
                                'data-test': `@coinmarket/menu/dropdown/${item.route}`,
                            })),
                        },
                    ]}
                />
            )}
        />
    );
};
