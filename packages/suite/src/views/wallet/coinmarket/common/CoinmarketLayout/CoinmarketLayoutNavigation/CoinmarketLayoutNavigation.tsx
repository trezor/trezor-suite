import { Row } from '@trezor/components';
import { CoinmarketLayoutNavigationItem } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/CoinmarketLayoutNavigation/CoinmarketLayoutNavigationItem';

export const CoinmarketLayoutNavigation = () => (
    <Row>
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
        <CoinmarketLayoutNavigationItem
            route="wallet-coinmarket-dca"
            title="TR_NAV_DCA"
            icon="clock"
        />
    </Row>
);
