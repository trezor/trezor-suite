import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import * as routerActions from '@suite-actions/routerActions';
import * as coinmarketSavingsActions from '@wallet-actions/coinmarketSavingsActions';
import { useSelector, useActions } from '@suite-hooks';
import { WalletLayoutNavigation, WalletLayoutNavLink } from '@wallet-components';

const SavingsWalletLayoutNavLinkWrapper = styled.div`
    display: flex;
    margin-left: auto;
    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin-left: 30px;
    }
`;

const Navigation = () => {
    const items = [
        { route: 'wallet-coinmarket-buy', title: 'TR_NAV_BUY' },
        { route: 'wallet-coinmarket-sell', title: 'TR_NAV_SELL' },
        { route: 'wallet-coinmarket-exchange', title: 'TR_NAV_EXCHANGE' },
        { route: 'wallet-coinmarket-spend', title: 'TR_NAV_SPEND' },
    ] as const;

    const { routeName, account, selectedProvider } = useSelector(state => ({
        routeName: state.router.route?.name,
        account: state.wallet.selectedAccount?.account,
        selectedProvider: state.wallet.coinmarket.savings.selectedProvider,
    }));
    const { goto, loadSavingsTrade } = useActions({
        goto: routerActions.goto,
        loadSavingsTrade: coinmarketSavingsActions.loadSavingsTrade,
    });

    return (
        <WalletLayoutNavigation>
            <>
                {items.map(({ route, title }) => (
                    <WalletLayoutNavLink
                        key={route}
                        title={title}
                        active={routeName === route}
                        onClick={() => goto(route, { preserveParams: true })}
                    />
                ))}
                {account?.symbol === 'btc' && (
                    <SavingsWalletLayoutNavLinkWrapper>
                        <WalletLayoutNavLink
                            key="wallet-coinmarket-savings"
                            title="TR_NAV_SAVINGS"
                            active={!!routeName?.startsWith('wallet-coinmarket-savings')}
                            onClick={() =>
                                // TODO: Better to first redirect and then show loading spinner/skeleton during requests.
                                selectedProvider && loadSavingsTrade(selectedProvider.name)
                            }
                        />
                    </SavingsWalletLayoutNavLinkWrapper>
                )}
            </>
        </WalletLayoutNavigation>
    );
};

export default Navigation;
