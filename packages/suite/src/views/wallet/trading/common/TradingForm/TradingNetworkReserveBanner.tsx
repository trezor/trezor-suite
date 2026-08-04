import { Translation } from '@suite/intl';
import { SettingsAnchor, goto } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectNetworkConfigDeps } from '@suite-common/wallet-config';
import { selectIsNetworkReserveEnabled } from '@suite-common/wallet-core';
import { getNetworkReserve } from '@suite-common/wallet-utils';
import { Banner } from '@trezor/components';

import { useDispatch, useSelector } from 'src/hooks/suite';

interface TradingNetworkReserveBannerProps {
    symbol: NetworkSymbol;
    contractAddress?: string;
}

export const TradingNetworkReserveBanner = ({
    symbol,
    contractAddress,
}: TradingNetworkReserveBannerProps) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
    const dispatch = useDispatch();
    const isNetworkReserveEnabled = useSelector(selectIsNetworkReserveEnabled);

    const onManageClick = () => {
        dispatch(
            goto({
                routeName: 'settings-index',
                preserveParams: true,
                anchor: SettingsAnchor.NetworkReserve,
            }),
        );
    };

    if (!isNetworkReserveEnabled) return null;

    const networkReserve = getNetworkReserve({
        ...networkConfigDeps,
        symbol,
        contractAddress,
        isEnabled: isNetworkReserveEnabled,
    });
    if (!networkReserve) return null;

    const network = networkConfigDeps.getNetworkConfig(symbol);

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
