import { A } from '@mobily/ts-belt';

import { HeaderedCard, VStack } from '@suite-native/atoms';
import { Network, NetworkSymbol } from '@suite-common/wallet-config';
import {
    mainnetsOrder,
    testnetsOrder,
    importEnabledMainnets,
    importEnabledTestnets,
} from '@suite-native/config';

import { SelectableNetworkItem } from './SelectableNetworkItem';

type SelectableAssetListProps = {
    onSelectItem: (networkSymbol: NetworkSymbol) => void;
};

const sortNetworkItems = (networkItems: Network[], networkOrder: NetworkSymbol[]): Network[] =>
    A.sort(networkItems, (a, b) => {
        const aOrder = networkOrder.indexOf(a.symbol) ?? Number.MAX_SAFE_INTEGER;
        const bOrder = networkOrder.indexOf(b.symbol) ?? Number.MAX_SAFE_INTEGER;
        return aOrder - bOrder;
    }) as Network[];

const sortedMainnetsNetworks = sortNetworkItems(importEnabledMainnets, mainnetsOrder);
const sortedTestnetNetworks = sortNetworkItems(importEnabledTestnets, testnetsOrder);

const NetworkItemSection = ({
    title,
    networks,
    onSelectItem,
}: {
    title: string;
    networks: Network[];
    onSelectItem: SelectableAssetListProps['onSelectItem'];
}) => (
    <HeaderedCard title={title}>
        <VStack spacing="large">
            {networks.map(({ symbol }) => (
                <SelectableNetworkItem
                    key={symbol}
                    symbol={symbol}
                    data-testID={`@onboarding/select-coin/${symbol}`}
                    onPress={onSelectItem}
                />
            ))}
        </VStack>
    </HeaderedCard>
);

export const SelectableNetworkList = ({ onSelectItem }: SelectableAssetListProps) => (
    <VStack spacing="large">
        <NetworkItemSection
            title="Select a coin to sync"
            networks={sortedMainnetsNetworks}
            onSelectItem={onSelectItem}
        />

        <NetworkItemSection
            title="Testnet coins (have no value – for testing purposes only)"
            networks={sortedTestnetNetworks}
            onSelectItem={onSelectItem}
        />
    </VStack>
);
