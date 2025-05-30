import { ReactNode, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { isTestnet } from '@suite-common/wallet-utils';
import { SelectableNetworkItem } from '@suite-native/accounts';
import { HeaderedCard, VStack } from '@suite-native/atoms';
import { selectDiscoveryNetworkSymbols } from '@suite-native/discovery';
import { Translation } from '@suite-native/intl';
import { selectAreTestnetsEnabled } from '@suite-native/settings';
import { arrayPartition } from '@trezor/utils';

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
    const symbols = useSelector(selectDiscoveryNetworkSymbols);
    const areTestnetsEnabled = useSelector(selectAreTestnetsEnabled);

    const [testnetSymbols, mainnetSymbols] = useMemo(
        () => arrayPartition(symbols, isTestnet),
        [symbols],
    );

    return (
        <VStack spacing="sp24">
            <NetworkItemSection
                title={<Translation id="moduleAccountImport.coinList.mainnets" />}
                symbols={mainnetSymbols}
                onSelectItem={onSelectItem}
            />
            {areTestnetsEnabled && (
                <NetworkItemSection
                    title={<Translation id="moduleAccountImport.coinList.testnets" />}
                    symbols={testnetSymbols}
                    onSelectItem={onSelectItem}
                />
            )}
        </VStack>
    );
};
