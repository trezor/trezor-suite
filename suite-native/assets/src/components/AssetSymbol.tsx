import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { Text, type TextProps } from '@suite-native/atoms';
import { TokenSymbol } from '@suite-native/tokens';

type AssetSymbolProps = Omit<TextProps, 'children'> & {
    networkSymbol: NetworkSymbol;
    contractAddress?: TokenAddress;
    isTruncated?: boolean;
};

/** The symbol of a coin or a token; an unrecognized token's symbol has its URLs masked. */
export const AssetSymbol = ({
    networkSymbol,
    contractAddress,
    isTruncated,
    ...textProps
}: AssetSymbolProps) =>
    contractAddress ? (
        <TokenSymbol
            {...textProps}
            networkSymbol={networkSymbol}
            contractAddress={contractAddress}
            isTruncated={isTruncated}
        />
    ) : (
        <Text {...textProps}>{getNetworkDisplaySymbol(networkSymbol)}</Text>
    );
