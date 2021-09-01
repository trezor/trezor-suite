import React from 'react';
import * as routerActions from '@suite-actions/routerActions';
import { useSelector, useActions } from '@suite-hooks';
import { WalletLayoutNavigation, WalletLayoutNavLink } from '@wallet-components';

const Navigation = () => {
    const items = [
        { route: 'wallet-coinmarket-buy', title: 'TR_NAV_BUY' },
        { route: 'wallet-coinmarket-sell', title: 'TR_NAV_SELL' },
        { route: 'wallet-coinmarket-exchange', title: 'TR_NAV_EXCHANGE' },
        { route: 'wallet-coinmarket-spend', title: 'TR_NAV_SPEND' },
    ] as const;

    const routeName = useSelector(state => state.router.route?.name);
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <WalletLayoutNavigation>
            {items.map(({ route, title }) => (
                <WalletLayoutNavLink
                    key={route}
                    title={title}
                    active={routeName === route}
                    onClick={() => goto(route, undefined, true)}
                />
            ))}
        </WalletLayoutNavigation>
    );
};

export default Navigation;
