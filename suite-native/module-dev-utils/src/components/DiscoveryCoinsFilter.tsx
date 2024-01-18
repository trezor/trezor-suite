import { useDispatch, useSelector } from 'react-redux';

import { VStack, Text, HStack, Switch, Card } from '@suite-native/atoms';
import {
    selectAreTestnetsEnabled,
    selectDisabledDiscoveryNetworkSymbolsForDevelopment,
    selectDiscoverySupportedNetworks,
    toggleDisabledDiscoveryNetworkSymbolsForDevelopment,
} from '@suite-native/discovery';
import { DeviceRootState } from '@suite-common/wallet-core';
import { NetworkSymbol } from '@suite-common/wallet-config';

export const DiscoveryCoinsFilter = () => {
    const areTestnetsEnabled = useSelector(selectAreTestnetsEnabled);
    const networks = useSelector((state: DeviceRootState) =>
        selectDiscoverySupportedNetworks(state, areTestnetsEnabled),
    );
    const disabledNetworkSymbols = useSelector(selectDisabledDiscoveryNetworkSymbolsForDevelopment);

    const dispatch = useDispatch();

    const handleSwitchChange = (network: NetworkSymbol) => {
        dispatch(toggleDisabledDiscoveryNetworkSymbolsForDevelopment(network));
    };

    const uniqueNetworkSymbols = [...new Set(networks.map(n => n.symbol))];

    return (
        <Card>
            <VStack spacing="small">
                <Text variant="titleSmall">Disable discovery of networks</Text>
                <VStack>
                    {uniqueNetworkSymbols.map((network: NetworkSymbol) => (
                        <HStack justifyContent="space-between" key={network}>
                            <Text>{network.toUpperCase()}</Text>
                            <Switch
                                onChange={() => handleSwitchChange(network)}
                                isChecked={!disabledNetworkSymbols.includes(network)}
                            />
                        </HStack>
                    ))}
                </VStack>
            </VStack>
        </Card>
    );
};
