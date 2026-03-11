import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { selectIsNetworkReserveEnabled } from '@suite-common/wallet-core';
import { getNetworkReserve } from '@suite-common/wallet-utils';
import { Banner } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

interface TradingNetworkReserveBannerProps {
    symbol: NetworkSymbol;
    contractAddress?: string;
}

export const TradingNetworkReserveBanner = ({
    symbol,
    contractAddress,
}: TradingNetworkReserveBannerProps) => {
    const dispatch = useDispatch();
    const isNetworkReserveEnabled = useSelector(selectIsNetworkReserveEnabled);

    const onManageClick = () => {
        dispatch(
            goto('settings-index', {
                preserveParams: true,
                anchor: SettingsAnchor.NetworkReserve,
            }),
        );
    };

    if (!isNetworkReserveEnabled) return null;

    const networkReserve = getNetworkReserve({
        symbol,
        contractAddress,
        isEnabled: isNetworkReserveEnabled,
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
