import styled from 'styled-components';
import { useDevice } from 'src/hooks/suite';
import { FirmwareType } from '@trezor/connect';
import CoinmarketLayoutNavigationItem from './CoinmarketLayoutNavigationItem';

const List = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
`;

const CoinmarketLayoutNavigation = () => {
    const { device } = useDevice();
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

            <CoinmarketLayoutNavigationItem
                route="wallet-coinmarket-transactions"
                title="TR_COINMARKET_LAST_TRANSACTIONS"
            />
        </List>
    );
};

export default CoinmarketLayoutNavigation;
