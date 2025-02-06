import {
    NetworkDisplaySymbol,
    NetworkSymbol,
    getNetworkDisplaySymbol,
} from '@suite-common/wallet-config';
import { TokenAddress } from '@suite-common/wallet-types';
import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { CryptoIcon, CryptoIconSize, cryptoIconSizes } from './CryptoIcon';
import { NetworkIcon, networkIconSizes } from './NetworkIcon';

export interface CryptoIconWithNetworkProps {
    symbol: NetworkSymbol;
    contractAddress?: TokenAddress;
    size?: CryptoIconSize;
}

const networkWrapperStyle = prepareNativeStyle<{ size: CryptoIconSize }>((utils, { size }) => ({
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.borderElevation1,
    borderRadius: networkIconSizes[size] / 3,
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
        <Box style={{ width: cryptoIconSizes[size], height: cryptoIconSizes[size] }}>
            <CryptoIcon symbol={iconSymbol} contractAddress={contractAddress} size={size} />
            {shouldShowNetwork && (
                <Box style={applyStyle(networkWrapperStyle, { size })}>
                    <NetworkIcon symbol={symbol} size={size} />
                </Box>
            )}
        </Box>
    );
};
