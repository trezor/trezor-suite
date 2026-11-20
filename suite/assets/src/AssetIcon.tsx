import { useTokenMetadata } from '@suite-common/token';
import { type AssetId } from '@suite-common/tokens';
import { TokenIcon, type TokenIconProps } from '@trezor/product-components';

type AssetIconProps = Omit<
    TokenIconProps,
    keyof AssetId | 'placeholder' | 'placeholderWithTooltip'
> &
    AssetId;

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
