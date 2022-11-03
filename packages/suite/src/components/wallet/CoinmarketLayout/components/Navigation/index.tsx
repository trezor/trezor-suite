import React from 'react';
import styled from 'styled-components';
import * as routerActions from '@suite-actions/routerActions';
import { useSelector, useActions } from '@suite-hooks';
import { WalletLayoutNavigation, WalletLayoutNavLink } from '@wallet-components';
import { getTitleForNetwork } from '@suite-common/wallet-utils';
import { Translation } from '@suite-components';

const SavingsWalletLayoutNavLinkWrapper = styled.div`
    display: flex;
    margin-left: auto;
    padding-left: 42px;
`;

const Navigation = () => {
    const items = [
        { route: 'wallet-coinmarket-buy', title: 'TR_NAV_BUY' },
        { route: 'wallet-coinmarket-sell', title: 'TR_NAV_SELL' },
        { route: 'wallet-coinmarket-exchange', title: 'TR_NAV_EXCHANGE' },
        { route: 'wallet-coinmarket-spend', title: 'TR_NAV_SPEND' },
    ] as const;

    const { routeName, account, p2pSupportedCoins, savingsProviders } = useSelector(state => ({
        routeName: state.router.route?.name,
        account: state.wallet.selectedAccount?.account,
        p2pSupportedCoins: state.wallet.coinmarket.p2p.p2pInfo?.supportedCoins,
        savingsProviders: state.wallet.coinmarket.savings.savingsInfo?.savingsList?.providers,
    }));
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    const showP2pTab = account && p2pSupportedCoins && p2pSupportedCoins.has(account.symbol);
    const showSavingsTab =
        account &&
        savingsProviders &&
        savingsProviders.some(
            savingsProvider =>
                savingsProvider.isActive &&
                savingsProvider.tradedCoins.includes(account.symbol.toUpperCase()),
        );

    const p2pRoute = 'wallet-coinmarket-p2p';

    return (
        <WalletLayoutNavigation>
            <>
                {items.map(({ route, title }) => (
                    <WalletLayoutNavLink
                        data-test={`@coinmarket/menu/${route}`}
                        key={route}
                        title={title}
                        active={routeName === route}
                        onClick={() => goto(route, { preserveParams: true })}
                    />
                ))}
                {showP2pTab && (
                    <WalletLayoutNavLink
                        key={p2pRoute}
                        title="TR_NAV_P2P"
                        active={routeName === p2pRoute}
                        onClick={() => goto(p2pRoute, { preserveParams: true })}
                    />
                )}
                {showSavingsTab && (
                    <SavingsWalletLayoutNavLinkWrapper>
                        <WalletLayoutNavLink
                            key="wallet-coinmarket-savings"
                            title="TR_NAV_SAVINGS"
                            values={{
                                cryptoCurrencyName: (
                                    <Translation id={getTitleForNetwork(account.symbol)} />
                                ),
                            }}
                            badge="TR_NAV_SAVINGS_BADGE"
                            active={!!routeName?.startsWith('wallet-coinmarket-savings')}
                            onClick={() =>
                                goto('wallet-coinmarket-savings-setup', { preserveParams: true })
                            }
                        />
                    </SavingsWalletLayoutNavLinkWrapper>
                )}
            </>
        </WalletLayoutNavigation>
    );
};

export default Navigation;
