import { useSelector } from 'react-redux';

import { selectNetworkConfigs } from '@suite-common/networks';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Text, type TextProps } from '@suite-native/atoms';
import { TokenName } from '@suite-native/tokens';

type AssetLabelProps = Omit<TextProps, 'children'> & {
    networkSymbol: NetworkSymbol;
    contractAddress?: TokenAddress;
};

/** The name of a network's coin, or of a token with URLs masked when it is unrecognized. */
export const AssetLabel = ({ networkSymbol, contractAddress, ...textProps }: AssetLabelProps) => {
    const networkConfigs = useSelector(selectNetworkConfigs);

    if (contractAddress) {
        return (
            <TokenName
                {...textProps}
                networkSymbol={networkSymbol}
                contractAddress={contractAddress}
            />
        );
    }

    const network = networkConfigs.find(config => config.symbol === networkSymbol);
    // `arb`'s coin is ETH, so it is named after Ethereum.
    const issuingNetwork = networkConfigs.find(
        config => config.symbol === network?.displaySymbol.toLowerCase(),
    );

    return (
        <Text {...textProps}>
            {issuingNetwork?.name ?? (network?.displaySymbolName || network?.name)}
        </Text>
    );
};
