import { Translation } from '@suite/intl';
import { SettingsAnchor, gotoThunk } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import { getTradingNetworkReserve } from '@suite-common/trading';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { selectIsNetworkReserveEnabled } from '@suite-common/wallet-core';
import { Banner } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

interface TradingNetworkReserveBannerProps {
    symbol: NetworkSymbol;
    contractAddress?: string;
    isTradingDex?: boolean;
}

export const TradingNetworkReserveBanner = ({
    symbol,
    contractAddress,
    isTradingDex,
}: TradingNetworkReserveBannerProps) => {
    const dispatch = useDispatch();
    const isNetworkReserveEnabled = useSelector(selectIsNetworkReserveEnabled);

    const onManageClick = () => {
        dispatch(
            gotoThunk({
                routeName: 'settings-index',
                preserveParams: true,
                anchor: SettingsAnchor.NetworkReserve,
            }),
        );
    };

    if (!isNetworkReserveEnabled) return null;

    const networkReserve = getTradingNetworkReserve({
        symbol,
        contractAddress,
        isDex: !!isTradingDex,
        isNetworkReserveEnabled,
    });
    if (!networkReserve) return null;

    const network = getNetwork(symbol);

    return (
        <Banner
            data-testid="@send/network-reserve-banner"
            intent="info"
            rightContent={
                <Banner.Button onClick={onManageClick}>
                    <Translation id="TR_NETWORK_RESERVE_MANAGE" />
                </Banner.Button>
            }
            description={
                <Translation
                    id="TR_NETWORK_RESERVE_BANNER"
                    values={{
                        amount: networkReserve,
                        displaySymbol: network.displaySymbol,
                    }}
                />
            }
        />
    );
};
