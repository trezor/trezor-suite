import { getNetwork } from '@suite-common/wallet-config';
import { TokenIconSet, type TokenIconSetProps } from '@trezor/product-components';

import { AssetIcon } from './AssetIcon';

export type AssetIconSetProps = Omit<TokenIconSetProps, 'renderIcon'> & {
    isTransparent?: boolean;
};

export const AssetIconSet = ({ symbol, isTransparent = false, ...props }: AssetIconSetProps) => (
    <TokenIconSet
        {...props}
        symbol={symbol}
        renderIcon={(token, size) => {
            const networkSymbol = token.networkSymbol ?? symbol;
            const nativeSymbol = getNetwork(networkSymbol).settlementLayer ?? networkSymbol;

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
                <AssetIcon size={size} symbol={nativeSymbol} />
            );
        }}
    />
);
