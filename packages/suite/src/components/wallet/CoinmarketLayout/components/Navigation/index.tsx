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

    const { routeName, account } = useSelector(state => ({
        routeName: state.router.route?.name,
        account: state.wallet.selectedAccount.account,
    }));
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <WalletLayoutNavigation>
            <>{items.map(({ route, title }) => (
                <WalletLayoutNavLink
                        key={route}
                        title={title}
                        active={routeName === route}
                        onClick={() => goto(route, { preserveParams: true })}
                    />
                ))}
                {account?.symbol === 'btc' && (
                    <WalletLayoutNavLink
                        key="wallet-coinmarket-savings"
                        title="TR_NAV_SAVINGS"
                        active={routeName === 'wallet-coinmarket-savings'}
                        onClick={() => goto('wallet-coinmarket-savings', { preserveParams: true })}
                    />
                )}
            </>
        </WalletLayoutNavigation>
    );
};

export default Navigation;
