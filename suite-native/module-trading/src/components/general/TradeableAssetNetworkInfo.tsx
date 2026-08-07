import { useServices } from '@suite-common/dependency-injection';
import { selectGetNetworkConfigDep } from '@suite-common/networks';
import { invariant } from '@suite-common/suite-utils';
import { cryptoIdToSymbol } from '@suite-common/trading';
import { Box, HStack, Text } from '@suite-native/atoms';
import { NetworkIcon } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';
import { type TradeableAsset } from '@suite-native/trading-types';

export type TradeableAssetNetworkInfoProps = {
    asset: TradeableAsset | undefined;
};

export const TradeableAssetNetworkInfo = ({ asset }: TradeableAssetNetworkInfoProps) => {
    const { getNetworkConfig } = useServices(selectGetNetworkConfigDep);
    const { translate } = useTranslate();

    if (!asset) {
        return null;
    }

    const { cryptoId, contractAddress } = asset;
    const symbol = cryptoIdToSymbol({ getNetworkConfig }, cryptoId);
    invariant(symbol, 'Symbol should be defined');

    const { displaySymbol, name } = getNetworkConfig(symbol);
    const showForNativeToken = displaySymbol === 'ETH' && symbol !== 'eth';
    const shouldShowNetwork = showForNativeToken || contractAddress;

    if (!shouldShowNetwork) {
        // Return empty `View` instead of `null` to simplify the layout management
        return <Box />;
    }

    return (
        <HStack paddingHorizontal="sp8">
            <NetworkIcon symbol={symbol} size="large" />
            <Text
                variant="body-sm"
                color="contentPrimary"
                accessibilityLabel={translate('moduleTrading.networkName')}
            >
                {name}
            </Text>
        </HStack>
    );
};
