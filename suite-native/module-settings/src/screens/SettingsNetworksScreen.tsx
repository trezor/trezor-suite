import { useSelector } from 'react-redux';

import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { BtcOnlyCoinEnablingContent, CoinEnablingForm } from '@suite-native/coin-enabling';
import { selectDiscoveryNetworkSymbols } from '@suite-native/discovery';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

export const SettingsNetworksScreen = () => {
    const availableNetworkSymbols = useSelector(selectDiscoveryNetworkSymbols);
    const hasBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);

    //testnets can be enabled and we want to show networks that case
    const showNetworks = availableNetworkSymbols.length > 1 || !hasBitcoinOnlyFirmware;

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={<Translation id="moduleSettings.networks.title" />}
                    subtitle={
                        <Translation
                            id={
                                showNetworks
                                    ? 'moduleSettings.networks.subtitle.configurable'
                                    : 'moduleSettings.networks.subtitle.bitcoinOnly'
                            }
                        />
                    }
                />
            }
        >
            {showNetworks ? <CoinEnablingForm /> : <BtcOnlyCoinEnablingContent />}
        </Screen>
    );
};
