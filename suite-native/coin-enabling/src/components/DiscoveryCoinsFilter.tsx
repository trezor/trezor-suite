import { useDispatch } from 'react-redux';
import { useEffect } from 'react';

import { VStack, Text, HStack, Switch, Card } from '@suite-native/atoms';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { toggleEnabledDiscoveryNetworkSymbol } from '@suite-native/discovery';

import { useCoinEnabling } from '../hooks/useCoinEnabling';

export const DiscoveryCoinsFilter = () => {
    const dispatch = useDispatch();

    const { enabledNetworkSymbols, availableNetworks, applyDiscoveryChanges } = useCoinEnabling();

    useEffect(() => {
        // This will run when the component is unmounted (leaving the screen) and trigger the applyDiscoveryChanges function
        return () => applyDiscoveryChanges();
    }, [applyDiscoveryChanges]);

    const uniqueNetworkSymbols = [...new Set(availableNetworks.map(n => n.symbol))];

    return (
        <Card>
            <VStack spacing="small">
                <Text variant="titleSmall">Enable discovery of networks</Text>
                <VStack>
                    {uniqueNetworkSymbols.map((networkSymbol: NetworkSymbol) => (
                        <HStack justifyContent="space-between" key={networkSymbol}>
                            <Text>{networkSymbol.toUpperCase()}</Text>
                            <Switch
                                onChange={() =>
                                    dispatch(toggleEnabledDiscoveryNetworkSymbol(networkSymbol))
                                }
                                isChecked={enabledNetworkSymbols.includes(networkSymbol)}
                            />
                        </HStack>
                    ))}
                </VStack>
            </VStack>
        </Card>
    );
};
