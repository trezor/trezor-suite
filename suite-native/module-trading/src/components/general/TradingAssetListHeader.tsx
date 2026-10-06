import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Box, HStack, SearchInput } from '@suite-native/atoms';

import { NetworkPicker, type NetworkPickerProps } from './NetworkPicker/NetworkPicker';

export type TradingAssetListHeaderProps = {
    networkFilterMode?: NetworkPickerProps['networkFilterMode'];
    onFilterChange: (value: string) => void;
    onSelectedNetworkFilter: (symbol: NetworkSymbol | undefined) => void;
    placeholder: string;
    selectedNetworkFilter: NetworkSymbol | undefined;
    testID?: string;
};

export const TradingAssetListHeader = ({
    networkFilterMode,
    onFilterChange,
    onSelectedNetworkFilter,
    placeholder,
    selectedNetworkFilter,
    testID,
}: TradingAssetListHeaderProps) => (
    <HStack spacing="sp12" paddingHorizontal="sp16" alignItems="center">
        <Box flex={1}>
            <SearchInput
                onChange={onFilterChange}
                placeholder={placeholder}
                autoCorrect={false}
                size="large"
                testId={testID ? `${testID}/search-input` : undefined}
            />
        </Box>
        <NetworkPicker
            networkFilterMode={networkFilterMode}
            selectedNetwork={selectedNetworkFilter}
            onSelectNetwork={onSelectedNetworkFilter}
            testID={testID ? `${testID}/network-picker` : undefined}
        />
    </HStack>
);
