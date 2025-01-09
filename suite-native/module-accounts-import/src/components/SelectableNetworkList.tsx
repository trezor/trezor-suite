import { useSelector } from 'react-redux';
import { ReactNode } from 'react';

import { SelectableNetworkItem } from '@suite-native/accounts';
import { HeaderedCard, VStack } from '@suite-native/atoms';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    selectPortfolioTrackerMainnetNetworkSymbols,
    selectPortfolioTrackerTestnetNetworkSymbols,
} from '@suite-native/discovery';
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
    const portfolioMainnetNetworkSymbols = useSelector(selectPortfolioTrackerMainnetNetworkSymbols);
    const portfolioTestnetsNetworkSymbols = useSelector(
        selectPortfolioTrackerTestnetNetworkSymbols,
    );

    return (
        <VStack spacing="sp24">
            <NetworkItemSection
                title={<Translation id="moduleAccountImport.coinList.mainnets" />}
                symbols={portfolioMainnetNetworkSymbols}
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
