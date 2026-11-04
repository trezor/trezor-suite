import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { HStack, Text } from '@suite-native/atoms';
import { NetworkIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

type AssetSettingsNetworkSectionProps = {
    networkSymbol: NetworkSymbol;
};

export const AssetSettingsNetworkSection = ({
    networkSymbol,
}: AssetSettingsNetworkSectionProps) => (
    <HStack alignItems="center" justifyContent="space-between">
        <Text variant="body-sm" color="contentSecondary">
            <Translation id="moduleAssets.assetDetailScreen.settings.network" />
        </Text>
        <HStack alignItems="center" spacing="sp8">
            <Text variant="body-sm">{getNetwork(networkSymbol).name}</Text>
            <NetworkIcon symbol={networkSymbol} size={20} />
        </HStack>
    </HStack>
);
