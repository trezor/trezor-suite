import { useServices } from '@suite-common/dependency-injection';
import { injectNetworkIconRegistry } from '@suite-common/networks';
import { TokenIcon, TokenIconSet, type TokenIconSetProps } from '@trezor/product-components';

import { AssetIcon } from './AssetIcon';
import { getIconUrl } from './assetIconUtils';

export type AssetIconSetProps = Omit<TokenIconSetProps, 'renderIcon'> & {
    isTransparent?: boolean;
};

export const AssetIconSet = ({ symbol, isTransparent = false, ...props }: AssetIconSetProps) => {
    const { networkIconRegistry } = useServices(injectNetworkIconRegistry);

    return (
        <TokenIconSet
            {...props}
            symbol={symbol}
            renderIcon={(token, size) => {
                const networkSymbol = token.networkSymbol ?? symbol;
                const nativeSrc = networkIconRegistry.getNetworkIcon(networkSymbol)?.nativeSrc;

                return token.contract ? (
                    <AssetIcon
                        size={size}
                        symbol={networkSymbol}
                        contractAddress={token.contract}
                        placeholder={token.symbol ?? ''}
                        placeholderWithTooltip={false}
                        shouldTryToFetch
                        isBordered={false}
                        isTransparent={isTransparent}
                    />
                ) : (
                    <TokenIcon size={size} src={getIconUrl(nativeSrc)} />
                );
            }}
        />
    );
};
