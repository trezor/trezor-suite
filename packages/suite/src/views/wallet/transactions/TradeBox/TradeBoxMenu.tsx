import { Route } from '@suite-common/suite-types';
import { Account } from '@suite-common/wallet-types';
import { Button, variables } from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacingsPx } from '@trezor/theme';
import { ReactNode } from 'react';
import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import styled, { css } from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    gap: ${spacingsPx.sm};
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledButton = styled(Button)<{ $isHideable: boolean }>`
    ${({ $isHideable }) =>
        $isHideable &&
        css`
            ${variables.SCREEN_QUERY.MOBILE} {
                display: none;
            }
        `};
`;

interface TradeBoxMenuProps {
    account: Account;
}

export const TradeBoxMenu = ({ account }: TradeBoxMenuProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    const menuItems: {
        route: Route['name'];
        type: 'exchange' | 'buy' | 'sell';
        title: ReactNode;
        isHideable?: boolean;
    }[] = [
        {
            route: 'wallet-coinmarket-buy',
            type: 'buy',
            title: <Translation id="TR_NAV_BUY" />,
        },
        {
            route: 'wallet-coinmarket-sell',
            type: 'sell',
            title: <Translation id="TR_NAV_SELL" />,
            isHideable: true,
        },
        {
            route: 'wallet-coinmarket-exchange',
            type: 'exchange',
            title: <Translation id="TR_COINMARKET_SWAP" />,
        },
    ];

    return (
        <Wrapper>
            {menuItems
                .filter(item => !(item.type === 'exchange' && hasBitcoinOnlyFirmware(device)))
                .map(item => (
                    <StyledButton
                        $isHideable={!!item.isHideable}
                        key={item.route}
                        variant="tertiary"
                        size="small"
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
                        isDisabled={item.type !== 'buy' && account.empty}
                        data-testid={`@coinmarket/menu/${item.route}`}
                    >
                        {item.title}
                    </StyledButton>
                ))}
        </Wrapper>
    );
};
