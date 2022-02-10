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

    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const routeName = useSelector(state => state.router.route?.name);
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    const isRouteVisibleInCardano = (i: { route: string; title: string }) =>
        !(i.route === 'wallet-coinmarket-sell' || i.route === 'wallet-coinmarket-exchange');

    return (
        <WalletLayoutNavigation>
            {items
                .filter(i =>
                    selectedAccount.account?.networkType === 'cardano'
                        ? isRouteVisibleInCardano(i)
                        : true,
                )
                .map(({ route, title }) => (
                    <WalletLayoutNavLink
                        key={route}
                        title={title}
                        active={routeName === route}
                        onClick={() => goto(route, { preserveParams: true })}
                    />
                ))}
        </WalletLayoutNavigation>
    );
};

export default Navigation;
