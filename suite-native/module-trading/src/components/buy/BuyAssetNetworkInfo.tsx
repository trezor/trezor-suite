import { invariant } from '@suite-common/suite-utils';
import { cryptoIdToSymbol } from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import { Box, HStack, Text } from '@suite-native/atoms';
import { NetworkIcon } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';

import { useTradingBuyFormContext } from '../../hooks/buy/useBuyFormContext';

export const BuyAssetNetworkInfo = () => {
    const { translate } = useTranslate();
    const { watch } = useTradingBuyFormContext();
    const asset = watch('asset');

    if (!asset) {
        return null;
    }

    const { cryptoId, contractAddress } = asset;
    const symbol = cryptoIdToSymbol(cryptoId);
    invariant(symbol, 'Symbol should be defined');

    const { displaySymbol, name } = getNetwork(symbol);
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
                variant="hint"
                color="textDefault"
                accessibilityLabel={translate('moduleTrading.networkName')}
            >
                {name}
            </Text>
        </HStack>
    );
};
