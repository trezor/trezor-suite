import { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { SelectableNetworkItem } from '@suite-native/accounts';
import { HeaderedCard, VStack } from '@suite-native/atoms';
import { portfolioTrackerMainnets } from '@suite-native/config';
import { selectPortfolioTrackerTestnetNetworkSymbols } from '@suite-native/discovery';
import { Translation } from '@suite-native/intl';

type SelectableAssetListProps = {
    onSelectItem: (symbol: NetworkSymbol) => void;
};

const NetworkItemSection = ({
    title,
    symbols,
    onSelectItem,
}: {
    title: ReactNode;
    symbols: NetworkSymbol[];
    onSelectItem: SelectableAssetListProps['onSelectItem'];
}) => (
    <HeaderedCard title={title}>
        <VStack spacing="sp24">
            {symbols.map(symbol => (
                <SelectableNetworkItem key={symbol} symbol={symbol} onPress={onSelectItem} />
            ))}
        </VStack>
    </HeaderedCard>
);

export const SelectableNetworkList = ({ onSelectItem }: SelectableAssetListProps) => {
    const portfolioTestnetsNetworkSymbols = useSelector(
        selectPortfolioTrackerTestnetNetworkSymbols,
    );

    return (
        <VStack spacing="sp24">
            <NetworkItemSection
                title={<Translation id="moduleAccountImport.coinList.mainnets" />}
                symbols={portfolioTrackerMainnets}
                onSelectItem={onSelectItem}
            />
            <NetworkItemSection
                title={<Translation id="moduleAccountImport.coinList.testnets" />}
                symbols={portfolioTestnetsNetworkSymbols}
                onSelectItem={onSelectItem}
            />
        </VStack>
    );
};
