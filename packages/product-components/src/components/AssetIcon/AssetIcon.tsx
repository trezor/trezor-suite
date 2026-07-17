import { isCryptoIconSymbol, isNetworkIconSymbol } from '@suite-common/icons/src/iconUtils';
import {
    type NetworkSymbol,
    getNetworkOptional,
    shouldShowNetworkBadge,
} from '@suite-common/wallet-config';
import { Box } from '@trezor/components';

import { AssetLogo } from '../AssetLogo/AssetLogo';
import { type AllowedFrameProps, type AssetLogoSize } from '../AssetLogo/AssetLogoWithId';
import { CoinLogo } from '../CoinLogo/CoinLogo';
import { NetworkIconBadge } from '../NetworkIcon/NetworkIconBadge';

export type AssetIconProps = AllowedFrameProps & {
    symbol: NetworkSymbol;
    contractAddress?: string | null;
    size: AssetLogoSize;
    placeholder?: string;
    placeholderWithTooltip?: boolean;
    shouldTryToFetch?: boolean;
    isBordered?: boolean;
    customLogoUrl?: string;
    'data-testid'?: string;
};

export const AssetIcon = ({
    symbol,
    contractAddress,
    size,
    placeholder,
    placeholderWithTooltip,
    shouldTryToFetch,
    isBordered,
    customLogoUrl,
    margin,
    'data-testid': dataTestId,
}: AssetIconProps) => {
    const nativeCoinSymbol = getNetworkOptional(symbol)?.settlementLayer ?? symbol;

    const disc =
        !contractAddress && isCryptoIconSymbol(nativeCoinSymbol) ? (
            <CoinLogo symbol={nativeCoinSymbol} type="token" size={size} data-testid={dataTestId} />
        ) : (
            <AssetLogo
                symbol={symbol}
                contractAddress={contractAddress}
                size={size}
                placeholder={placeholder}
                placeholderWithTooltip={placeholderWithTooltip}
                shouldTryToFetch={shouldTryToFetch}
                isBordered={isBordered}
                customLogoUrl={customLogoUrl}
                showNetworkIcon={false}
                data-testid={dataTestId}
            />
        );

    const content =
        shouldShowNetworkBadge(symbol) && isNetworkIconSymbol(symbol) ? (
            <NetworkIconBadge networkSymbol={symbol} parentSize={size}>
                {disc}
            </NetworkIconBadge>
        ) : (
            disc
        );

    return <Box margin={margin}>{content}</Box>;
};
