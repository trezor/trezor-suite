import { useMemo, useState } from 'react';

import { Image } from 'expo-image';

import { type CryptoIconName, cryptoIcons, genericTokenIcon } from '@suite-common/icons';
import {
    type NetworkDisplaySymbol,
    type NetworkSymbol,
    getCoingeckoId,
    isNetworkSymbol,
} from '@suite-common/wallet-config';
import { getAssetLogoContractAddresses } from '@suite-common/wallet-utils';
import { useTranslate } from '@suite-native/intl';
import { getAssetLogoUrl } from '@trezor/asset-utils';
import { useKeyedAsyncValue } from '@trezor/react-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { CryptoIconPlaceholder } from './CryptoIconPlaceholder';

export interface CryptoIconProps {
    symbol: NetworkSymbol | NetworkDisplaySymbol;
    contractAddress?: string;
    size?: CryptoIconSize | number;
}

export const cryptoIconSizes = {
    tiny: 16,
    extraSmall: 24,
    small: 32,
    large: 48,
    extraLarge: 64,
} as const;

const iconStyle = prepareNativeStyle<{ width: number; height: number }>(
    (utils, { width, height }) => ({
        borderRadius: utils.borders.radii.round,
        overflow: 'hidden',
        width,
        height,
    }),
);

export type CryptoIconSize = keyof typeof cryptoIconSizes;

export const CryptoIcon = ({ symbol, contractAddress, size = 'small' }: CryptoIconProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    const sizeNumber = typeof size === 'number' ? size : cryptoIconSizes[size];
    const iconContainerStyle = useMemo(
        () => applyStyle(iconStyle, { width: sizeNumber, height: sizeNumber }),
        [applyStyle, sizeNumber],
    );

    // FlashList recycling reuses this instance for different assets, so the async and retry
    // state is keyed by the asset and discarded on mismatch to never render a stale icon
    const key = contractAddress ? `${symbol}:${contractAddress}` : symbol;
    // size is part of the source identity because it is encoded in the CDN filename
    const asyncKey = `${key}#${sizeNumber}`;

    const [loadState, setLoadState] = useState<{
        sourceKey: string;
        logoIndex: number;
        failed: boolean;
    } | null>(null);

    const resolvedUrls = useKeyedAsyncValue(asyncKey, async (): Promise<(string | number)[]> => {
        if (isNetworkSymbol(symbol)) {
            const coingeckoId = getCoingeckoId(symbol);
            if (coingeckoId && contractAddress) {
                const logoAddresses = await getAssetLogoContractAddresses(symbol, contractAddress);
                if (logoAddresses?.length) {
                    return logoAddresses.map(address =>
                        getAssetLogoUrl({
                            coingeckoId,
                            contractAddress: address,
                            density: 2,
                            size: sizeNumber,
                        }),
                    );
                }
            }
        }

        return [cryptoIcons[symbol.toLowerCase() as CryptoIconName]];
    });

    const sourceUrls = resolvedUrls ?? [cryptoIcons[symbol.toLowerCase() as CryptoIconName]];
    const sourceKey = resolvedUrls ? `${asyncKey}#resolved` : `${asyncKey}#fallback`;
    const logoIndex = loadState?.sourceKey === sourceKey ? loadState.logoIndex : 0;
    const showPlaceholder = loadState?.sourceKey === sourceKey ? loadState.failed : false;

    /**
     * Retries loading the icon with the next available address in sourceUrls.
     * This is crucial for:
     * - ADA, where the logo might be stored under either the policyId or the
     *   full contract address.
     * - XLM, where the logo might be stored under either the classic
     *   CODE-ISSUER address or the Soroban contract id, depending on how far
     *   CoinGecko has progressed with its Stellar id migration for the token.
     */
    const handleLoadError = () => {
        if (logoIndex + 1 >= sourceUrls.length) {
            setLoadState({ sourceKey, logoIndex, failed: true });
        } else {
            setLoadState({ sourceKey, logoIndex: logoIndex + 1, failed: false });
        }
    };

    if (showPlaceholder) {
        return (
            <CryptoIconPlaceholder
                placeholder={symbol.toUpperCase()}
                containerStyle={iconContainerStyle}
            />
        );
    }

    return (
        <Image
            source={sourceUrls[logoIndex]}
            accessibilityHint={translate('icons.cryptoIconHint')}
            accessibilityLabel={key}
            recyclingKey={asyncKey}
            style={iconContainerStyle}
            placeholder={genericTokenIcon}
            onError={handleLoadError}
            cachePolicy="memory-disk"
        />
    );
};
