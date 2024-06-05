import { SelectableNetworkItem } from '@suite-native/accounts';
import { HeaderedCard, VStack } from '@suite-native/atoms';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { portfolioTrackerMainnets, portfolioTrackerTestnets } from '@suite-native/config';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';

type SelectableAssetListProps = {
    onSelectItem: (networkSymbol: NetworkSymbol) => void;
};

const NetworkItemSection = ({
    title,
    networks,
    onSelectItem,
}: {
    title: string;
    networks: NetworkSymbol[];
    onSelectItem: SelectableAssetListProps['onSelectItem'];
}) => (
    <HeaderedCard title={title}>
        <VStack spacing="large">
            {networks.map(symbol => (
                <SelectableNetworkItem key={symbol} symbol={symbol} onPress={onSelectItem} />
            ))}
        </VStack>
    </HeaderedCard>
);

const TestnetNetworkItemSection = ({ onSelectItem }: SelectableAssetListProps) => {
    const [isRegtestEnabled] = useFeatureFlag(FeatureFlag.IsRegtestEnabled);
    const regtestAdjustedTestnets = isRegtestEnabled
        ? [...portfolioTrackerTestnets, 'regtest' as NetworkSymbol]
        : portfolioTrackerTestnets;

    return (
        <NetworkItemSection
            title="Testnet coins (have no value – for testing purposes only)"
            networks={regtestAdjustedTestnets}
            onSelectItem={onSelectItem}
        />
    );
};

export const SelectableNetworkList = ({ onSelectItem }: SelectableAssetListProps) => (
    <VStack spacing="large">
        <NetworkItemSection
            title="Select a coin to sync"
            networks={portfolioTrackerMainnets}
            onSelectItem={onSelectItem}
        />

        <TestnetNetworkItemSection onSelectItem={onSelectItem} />
    </VStack>
);
