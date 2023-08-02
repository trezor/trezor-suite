import React from 'react';
import styled from 'styled-components';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { WalletLayoutNavigation, WalletLayoutNavLink } from 'src/components/wallet';
import { getTitleForNetwork } from '@suite-common/wallet-utils';
import { Translation } from 'src/components/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

const SavingsWalletLayoutNavLinkWrapper = styled.div`
    display: flex;
    margin-left: auto;
    padding-left: 42px;
`;

const items = [
    { route: 'wallet-coinmarket-buy', title: 'TR_NAV_BUY' },
    { route: 'wallet-coinmarket-sell', title: 'TR_NAV_SELL' },
    { route: 'wallet-coinmarket-exchange', title: 'TR_NAV_EXCHANGE' },
    { route: 'wallet-coinmarket-spend', title: 'TR_NAV_SPEND' },
] as const;
const p2pRoute = 'wallet-coinmarket-p2p';

const Navigation = () => {
    const routeName = useSelector(state => state.router.route?.name);
    const account = useSelector(selectSelectedAccount);
    const p2pSupportedCoins = useSelector(
        state => state.wallet.coinmarket.p2p.p2pInfo?.supportedCoins,
    );
    const savingsProviders = useSelector(
        state => state.wallet.coinmarket.savings.savingsInfo?.savingsList?.providers,
    );
    const dispatch = useDispatch();

    const showP2pTab = account && p2pSupportedCoins && p2pSupportedCoins.has(account.symbol);
    const showSavingsTab =
        account &&
        savingsProviders &&
        savingsProviders.some(
            savingsProvider =>
                savingsProvider.isActive &&
                savingsProvider.tradedCoins.includes(account.symbol.toUpperCase()),
        );

    const goToP2p = () => dispatch(goto(p2pRoute, { preserveParams: true }));
    const goToSavingsSetup = () =>
        dispatch(
            goto('wallet-coinmarket-savings-setup', {
                preserveParams: true,
            }),
        );

    return (
        <WalletLayoutNavigation>
            <>
                {items.map(({ route, title }) => (
                    <WalletLayoutNavLink
                        data-test={`@coinmarket/menu/${route}`}
                        key={route}
                        title={title}
                        active={routeName === route}
                        onClick={() => dispatch(goto(route, { preserveParams: true }))}
                    />
                ))}
                {showP2pTab && (
                    <WalletLayoutNavLink
                        key={p2pRoute}
                        title="TR_NAV_P2P"
                        active={routeName === p2pRoute}
                        onClick={goToP2p}
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
                            onClick={goToSavingsSetup}
                        />
                    </SavingsWalletLayoutNavLinkWrapper>
                )}
            </>
        </WalletLayoutNavigation>
    );
};

export default Navigation;
