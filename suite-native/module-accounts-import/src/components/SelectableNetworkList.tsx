import { SelectableNetworkItem } from '@suite-native/accounts';
import { HeaderedCard, VStack } from '@suite-native/atoms';
import { Network, NetworkSymbol } from '@suite-common/wallet-config';
import { portfolioTrackerMainnets, portfolioTrackerTestnets } from '@suite-native/config';

type SelectableAssetListProps = {
    onSelectItem: (networkSymbol: NetworkSymbol) => void;
};

const NetworkItemSection = ({
    title,
    networks,
    onSelectItem,
}: {
    title: string;
    networks: readonly Network[];
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
            networks={portfolioTrackerMainnets}
            onSelectItem={onSelectItem}
        />

        <NetworkItemSection
            title="Testnet coins (have no value – for testing purposes only)"
            networks={portfolioTrackerTestnets}
            onSelectItem={onSelectItem}
        />
    </VStack>
);
