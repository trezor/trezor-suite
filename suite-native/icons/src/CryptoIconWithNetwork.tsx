import { View } from 'react-native';

import {
    type NetworkDisplaySymbol,
    type NetworkSymbol,
    getNetworkDisplaySymbol,
} from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type CryptoIconSize, cryptoIconSizes } from './CryptoIcon';
import { NetworkLogo, networkLogoSizes } from './NetworkLogo';
import { TokenLogo } from './TokenLogo';

interface CryptoIconWithNetworkProps {
    symbol: NetworkSymbol;
    contractAddress?: TokenAddress;
    size?: CryptoIconSize;
}

const networkWrapperStyle = prepareNativeStyle<{ size: CryptoIconSize }>((utils, { size }) => ({
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.borderNeutral,
    borderRadius: networkLogoSizes[size] / 3,
}));

// This component shows network icon for tokens
// and for non Ethereum networks with native coin being eth (base, arbitrum, optimism)
export const CryptoIconWithNetwork = ({
    symbol,
    contractAddress,
    size = 'small',
}: CryptoIconWithNetworkProps) => {
    const { applyStyle } = useNativeStyles();
    const displaySymbol = getNetworkDisplaySymbol(symbol) as NetworkDisplaySymbol;
    const showForNativeToken = displaySymbol === 'ETH' && symbol !== 'eth';
    const shouldShowNetwork = showForNativeToken || contractAddress;

    const iconSymbol = contractAddress ? symbol : displaySymbol;

    return (
        <View style={{ width: cryptoIconSizes[size], height: cryptoIconSizes[size] }}>
            <TokenLogo
                symbol={iconSymbol as NetworkSymbol}
                contractAddress={contractAddress}
                size={size}
            />
            {shouldShowNetwork && (
                <View style={applyStyle(networkWrapperStyle, { size })}>
                    <NetworkLogo networkSymbol={symbol} size={size} />
                </View>
            )}
        </View>
    );
};
