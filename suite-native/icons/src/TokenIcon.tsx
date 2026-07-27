import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Image } from 'expo-image';

import { type CryptoIconName, cryptoIcons, genericTokenIcon } from '@suite-common/icons';
import {
    type NetworkDisplaySymbol,
    type NetworkSymbol,
    getCoingeckoId,
    getNetworkDisplaySymbol,
    isNetworkSymbol,
} from '@suite-common/wallet-config';
import { getAssetLogoContractAddresses } from '@suite-common/wallet-utils';
import { useTranslate } from '@suite-native/intl';
import { getAssetLogoUrl } from '@trezor/asset-utils';
import { useAsyncMemo } from '@trezor/react-utils';
import { type NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { MAX_FONT_SIZE_MULTIPLIER } from './Icon';
import { NetworkIcon, networkIconSizes } from './NetworkIcon';

export const tokenIconSizes = {
    tiny: 16,
    extraSmall: 24,
    small: 32,
    large: 48,
    extraLarge: 64,
} as const;

export type TokenIconSize = keyof typeof tokenIconSizes;

const iconStyle = prepareNativeStyle<{ width: number; height: number }>(
    (utils, { width, height }) => ({
        borderRadius: utils.borders.radii.round,
        overflow: 'hidden',
        width,
        height,
    }),
);

const networkWrapperStyle = prepareNativeStyle<{ size: TokenIconSize | number }>(
    (utils, { size }) => ({
        position: 'absolute',
        right: 0,
        bottom: 0,
        borderWidth: utils.borders.widths.small,
        borderColor: utils.colors.borderNeutral,
        borderRadius: typeof size === 'number' ? size : networkIconSizes[size] / 3,
    }),
);

const tokenIconPlaceholderIconStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.surfaceFillPage,
    alignItems: 'center',
    justifyContent: 'center',
}));

const tokenIconPlaceholderTextStyle = prepareNativeStyle(utils => ({
    ...utils.typography['body-md'],
    color: utils.colors.contentPrimary,
    textAlign: 'center',
}));

interface TokenIconPlaceholderProps {
    placeholder: string;
    containerStyle: NativeStyleObject;
    accessibilityLabel: string;
}

const TokenIconPlaceholder = ({
    placeholder,
    accessibilityLabel,
    containerStyle,
}: TokenIconPlaceholderProps) => {
    const { applyStyle } = useNativeStyles();
    const firstChar = placeholder[0] || 'T';

    // due to circular deps issues we need to use Text and View comp from 'react-native' instead of 'atoms'
    return (
        <View
            style={[containerStyle, applyStyle(tokenIconPlaceholderIconStyle)]}
            accessibilityLabel={accessibilityLabel}
        >
            <Text
                style={applyStyle(tokenIconPlaceholderTextStyle)}
                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
            >
                {firstChar}
            </Text>
        </View>
    );
};

interface TokenIconProps {
    symbol: NetworkSymbol | NetworkDisplaySymbol;
    contractAddress?: string;
    showNetworkIcon?: boolean;
    size?: TokenIconSize | number;
}

const TokenIconComponent = ({ symbol, contractAddress, size = 'small' }: TokenIconProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    const sizeNumber = typeof size === 'number' ? size : tokenIconSizes[size];
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

    const resolvedUrls = useAsyncMemo(async (): Promise<(string | number)[]> => {
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
    }, [contractAddress, sizeNumber, symbol]);

    const sourceUrls = resolvedUrls ?? [];
    const sourceKey = resolvedUrls ? `${asyncKey}#resolved` : `${asyncKey}#fallback`;
    const logoIndex = loadState?.sourceKey === sourceKey ? loadState.logoIndex : 0;
    const showPlaceholder =
        !resolvedUrls || (loadState?.sourceKey === sourceKey ? loadState.failed : false);

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
            <TokenIconPlaceholder
                placeholder={symbol.toUpperCase()}
                accessibilityLabel={key}
                containerStyle={iconContainerStyle}
            />
        );
    }

    return (
        <Image
            source={sourceUrls[logoIndex]}
            accessibilityHint={translate('icons.tokenIconHint')}
            accessibilityLabel={key}
            recyclingKey={asyncKey}
            style={iconContainerStyle}
            placeholder={genericTokenIcon}
            onError={handleLoadError}
            cachePolicy="memory-disk"
        />
    );
};

export const TokenIcon = ({
    symbol,
    contractAddress,
    showNetworkIcon = false,
    size = 'small',
}: TokenIconProps) => {
    const { applyStyle } = useNativeStyles();

    if (!showNetworkIcon || !isNetworkSymbol(symbol)) {
        return <TokenIconComponent symbol={symbol} contractAddress={contractAddress} size={size} />;
    }

    const displaySymbol = getNetworkDisplaySymbol(symbol) as NetworkDisplaySymbol;
    const showForNativeToken = displaySymbol === 'ETH' && symbol !== 'eth';
    const shouldShowNetwork = showForNativeToken || contractAddress;

    const iconSymbol = contractAddress ? symbol : displaySymbol;
    const iconSize = typeof size === 'number' ? size : tokenIconSizes[size];

    return (
        <View style={{ width: iconSize, height: iconSize }}>
            <TokenIconComponent
                symbol={iconSymbol}
                contractAddress={contractAddress}
                showNetworkIcon={showNetworkIcon}
                size={size}
            />
            {shouldShowNetwork && (
                <View style={applyStyle(networkWrapperStyle, { size: iconSize })}>
                    <NetworkIcon symbol={symbol} size={size} />
                </View>
            )}
        </View>
    );
};
