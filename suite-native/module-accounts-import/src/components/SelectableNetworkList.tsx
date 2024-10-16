import { useSelector } from 'react-redux';
import { ReactNode } from 'react';

import { SelectableNetworkItem } from '@suite-native/accounts';
import { HeaderedCard, VStack } from '@suite-native/atoms';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    selectPortfolioTrackerMainnetNetworkSymbols,
    selectPortfolioTrackerTestnetNetworkSymbols,
} from '@suite-native/discovery';
import { Translation } from '@suite-native/intl';

type SelectableAssetListProps = {
    onSelectItem: (networkSymbol: NetworkSymbol) => void;
};

const NetworkItemSection = ({
    title,
    networks,
    onSelectItem,
}: {
    title: ReactNode;
    networks: NetworkSymbol[];
    onSelectItem: SelectableAssetListProps['onSelectItem'];
}) => {
    return (
        <HeaderedCard title={title}>
            <VStack spacing="sp24">
                {networks.map(symbol => (
                    <SelectableNetworkItem key={symbol} symbol={symbol} onPress={onSelectItem} />
                ))}
            </VStack>
        </HeaderedCard>
    );
};

export const SelectableNetworkList = ({ onSelectItem }: SelectableAssetListProps) => {
    const portfolioMainnets = useSelector(selectPortfolioTrackerMainnetNetworkSymbols);
    const portfolioTestnets = useSelector(selectPortfolioTrackerTestnetNetworkSymbols);

    return (
        <VStack spacing="sp24">
            <NetworkItemSection
                title={<Translation id="moduleAccountImport.coinList.mainnets" />}
                networks={portfolioMainnets}
                onSelectItem={onSelectItem}
            />
            <NetworkItemSection
                title={<Translation id="moduleAccountImport.coinList.testnets" />}
                networks={portfolioTestnets}
                onSelectItem={onSelectItem}
            />
        </VStack>
    );
};
