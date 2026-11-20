import { useTokenMetadata } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { TokenIcon, type TokenIconProps } from '@trezor/product-components';

type AssetIconProps = Omit<
    TokenIconProps,
    'networkSymbol' | 'contractAddress' | 'placeholder' | 'placeholderWithTooltip'
> & {
    networkSymbol: NetworkSymbol;
    contractAddress?: TokenAddress;
};

/** The icon of a native token or a token; a token without a logo shows the first letter of its symbol. */
export const AssetIcon = ({ networkSymbol, contractAddress, ...props }: AssetIconProps) => {
    const token = useTokenMetadata(networkSymbol, contractAddress);

    return (
        <TokenIcon
            {...props}
            networkSymbol={networkSymbol}
            contractAddress={contractAddress}
            // Only the first letter, and no tooltip: the whole symbol could carry a URL unmasked.
            placeholder={token?.symbol?.charAt(0)}
            placeholderWithTooltip={false}
        />
    );
};
