import { View } from 'react-native';

import {
    type NetworkDisplaySymbol,
    type NetworkSymbol,
    getNetworkDisplaySymbol,
} from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { NetworkIcon, networkIconSizes } from './NetworkIcon';
import { TokenIcon, type TokenIconSize, tokenIconSizes } from './TokenIcon';

interface TokenIconWithNetworkProps {
    symbol: NetworkSymbol;
    contractAddress?: TokenAddress;
    size?: TokenIconSize;
}

const networkWrapperStyle = prepareNativeStyle<{ size: TokenIconSize }>((utils, { size }) => ({
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.borderNeutral,
    borderRadius: networkIconSizes[size] / 3,
}));

// This component shows network icon for tokens
// and for non Ethereum networks with native coin being eth (base, arbitrum, optimism)
export const TokenIconWithNetwork = ({
    symbol,
    contractAddress,
    size = 'small',
}: TokenIconWithNetworkProps) => {
    const { applyStyle } = useNativeStyles();
    const displaySymbol = getNetworkDisplaySymbol(symbol) as NetworkDisplaySymbol;
    const showForNativeToken = displaySymbol === 'ETH' && symbol !== 'eth';
    const shouldShowNetwork = showForNativeToken || contractAddress;

    const iconSymbol = contractAddress ? symbol : displaySymbol;

    return (
        <View style={{ width: tokenIconSizes[size], height: tokenIconSizes[size] }}>
            <TokenIcon symbol={iconSymbol} contractAddress={contractAddress} size={size} />
            {shouldShowNetwork && (
                <View style={applyStyle(networkWrapperStyle, { size })}>
                    <NetworkIcon symbol={symbol} size={size} />
                </View>
            )}
        </View>
    );
};
