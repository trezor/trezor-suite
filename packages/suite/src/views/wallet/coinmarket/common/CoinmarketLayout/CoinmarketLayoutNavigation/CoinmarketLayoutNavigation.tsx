import styled from 'styled-components';
import { useDevice } from 'src/hooks/suite';
import { Divider } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { CoinmarketLayoutNavigationItem } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/CoinmarketLayoutNavigation/CoinmarketLayoutNavigationItem';

const List = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
`;

const SeparatorWrapper = styled.div`
    height: 42px;
`;

export const CoinmarketLayoutNavigation = () => {
    const { device } = useDevice();

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

            {!hasBitcoinOnlyFirmware(device) ? (
                <CoinmarketLayoutNavigationItem
                    route="wallet-coinmarket-exchange"
                    title="TR_COINMARKET_SWAP"
                    icon="arrowsLeftRight"
                />
            ) : null}

            <SeparatorWrapper>
                <Divider
                    orientation="vertical"
                    strokeWidth={1}
                    margin={{ left: spacings.sm, right: spacings.sm }}
                />
            </SeparatorWrapper>
            <CoinmarketLayoutNavigationItem
                route="wallet-coinmarket-dca"
                title="TR_NAV_DCA"
                icon="clock"
            />

            <CoinmarketLayoutNavigationItem
                route="wallet-coinmarket-transactions"
                title="TR_COINMARKET_LAST_TRANSACTIONS"
            />
        </List>
    );
};
