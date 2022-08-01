import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import * as routerActions from '@suite-actions/routerActions';
import { useSelector, useActions } from '@suite-hooks';
import { WalletLayoutNavigation, WalletLayoutNavLink } from '@wallet-components';
import { getTitleForNetwork } from '@suite-common/wallet-utils';
import { Translation } from '@suite-components';

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

    const { routeName, account, savingsProviders } = useSelector(state => ({
        routeName: state.router.route?.name,
        account: state.wallet.selectedAccount?.account,
        savingsProviders: state.wallet.coinmarket.savings.savingsInfo?.savingsList?.providers,
    }));
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    const showSavingsTab =
        account &&
        savingsProviders &&
        savingsProviders.some(
            savingsProvider =>
                savingsProvider.isActive &&
                savingsProvider.tradedCoins.includes(account.symbol.toUpperCase()),
        );

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
