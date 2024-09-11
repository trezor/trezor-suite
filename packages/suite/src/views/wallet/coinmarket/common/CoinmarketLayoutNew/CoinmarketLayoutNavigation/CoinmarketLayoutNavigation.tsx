import styled from 'styled-components';
import { useDevice, useSelector } from 'src/hooks/suite';
import { FirmwareType } from '@trezor/connect';
import CoinmarketLayoutNavigationItem from './CoinmarketLayoutNavigationItem';
import { Divider } from '@trezor/components';
import { spacings } from '@trezor/theme';
import regional from 'src/constants/wallet/coinmarket/regional';
import { getIsTorEnabled } from 'src/utils/suite/tor';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';

const List = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
`;

const SeparatorWrapper = styled.div`
    height: 42px;
`;

interface CoinmarketLayoutNavigationProps {
    selectedAccount: SelectedAccountLoaded;
}

const CoinmarketLayoutNavigation = ({ selectedAccount }: CoinmarketLayoutNavigationProps) => {
    const { device } = useDevice();
    const isBitcoinOnly = device?.firmwareType === FirmwareType.BitcoinOnly;

    const isBtcAccount = selectedAccount.account.symbol === 'btc';
    const torStatus = useSelector(state => state.suite.torStatus);
    const isTorEnabled = getIsTorEnabled(torStatus);
    const country = useSelector(
        state =>
            state.wallet.coinmarket.buy.buyInfo?.buyInfo?.country ??
            state.wallet.coinmarket.sell.sellInfo?.sellList?.country,
    );
    const showDCA = Boolean(isBtcAccount && !isTorEnabled && country && regional.isInEEA(country));

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

            {showDCA ? (
                <>
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
                </>
            ) : null}

            <CoinmarketLayoutNavigationItem
                route="wallet-coinmarket-transactions"
                title="TR_COINMARKET_LAST_TRANSACTIONS"
            />
        </List>
    );
};

export default CoinmarketLayoutNavigation;
