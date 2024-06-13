import styled from 'styled-components';
import { useDevice, useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { FirmwareType } from '@trezor/connect';
import CoinmarketLayoutNavigationItem from './CoinmarketLayoutNavigationItem';

const List = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
`;

const CoinmarketLayoutNavigation = () => {
    const account = useSelector(selectSelectedAccount);
    const p2pSupportedCoins = useSelector(
        state => state.wallet.coinmarket.p2p.p2pInfo?.supportedCoins,
    );
    const savingsProviders = useSelector(
        state => state.wallet.coinmarket.savings.savingsInfo?.savingsList?.providers,
    );
    const { device } = useDevice();

    const showP2pTab = account && p2pSupportedCoins && p2pSupportedCoins.has(account.symbol);
    const showSavingsTab =
        account &&
        savingsProviders &&
        savingsProviders.some(
            savingsProvider =>
                savingsProvider.isActive &&
                savingsProvider.tradedCoins.includes(account.symbol.toUpperCase()),
        );

    const isBitcoinOnly = device?.firmwareType === FirmwareType.BitcoinOnly;

    return (
        <List>
            <CoinmarketLayoutNavigationItem
                route="wallet-coinmarket-buy"
                title="TR_NAV_BUY"
                icon="plus"
            />
            <CoinmarketLayoutNavigationItem
                route="wallet-coinmarket-sell"
                title="TR_NAV_SELL"
                icon="minus"
            />

            {!isBitcoinOnly ? (
                <CoinmarketLayoutNavigationItem
                    route="wallet-coinmarket-exchange"
                    title="TR_NAV_EXCHANGE"
                    icon="trade"
                />
            ) : null}

            {showSavingsTab && (
                <CoinmarketLayoutNavigationItem
                    route="wallet-coinmarket-savings-setup"
                    title="TR_NAV_SAVINGS"
                    icon="clock"
                />
            )}

            {showP2pTab && (
                <CoinmarketLayoutNavigationItem
                    route="wallet-coinmarket-p2p"
                    title="TR_NAV_P2P"
                    icon="userFocus"
                />
            )}
            <CoinmarketLayoutNavigationItem
                route="wallet-coinmarket-spend"
                title="TR_NAV_SPEND"
                icon="label"
            />
            <CoinmarketLayoutNavigationItem
                route="wallet-coinmarket-transactions"
                title="TR_COINMARKET_LAST_TRANSACTIONS"
            />
        </List>
    );
};

export default CoinmarketLayoutNavigation;
