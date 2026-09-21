import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Image } from 'expo-image';

import { type CryptoIconName, cryptoIcons } from '@suite-common/icons';
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
import { isWrappedNativeToken } from '@trezor/network-ethereum-suite-common';
import { useAsyncMemo } from '@trezor/react-utils';
import { type NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { MAX_FONT_SIZE_MULTIPLIER } from './Icon';
import { NetworkIcon, networkIconSizes } from './NetworkIcon';

export const tokenIconSizes = {
    tiny: 16,
    extraSmall: 24,
    small: 32,
    medium: 40,
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
    accessibilityLabel?: string;
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
    networkSymbol: NetworkSymbol | NetworkDisplaySymbol;
    contractAddress?: string;
    /** Asset ticker or name; pass null or undefined when token metadata is unavailable. */
    tokenSymbol: string | null | undefined;
    showNetworkIcon?: boolean;
    size?: TokenIconSize | number;
    /**
     * If the token is a wrapped native token (e.g. WETH), this prop determines whether to show the icon of the token itself or its network icon.
     */
    wrappedTokenIcon?: 'token' | 'network';
}

const TokenIconComponent = ({
    networkSymbol,
    contractAddress,
    tokenSymbol,
    size = 'small',
}: TokenIconProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    const sizeNumber = typeof size === 'number' ? size : tokenIconSizes[size];
    const iconContainerStyle = useMemo(
        () => applyStyle(iconStyle, { width: sizeNumber, height: sizeNumber }),
        [applyStyle, sizeNumber],
    );

    // FlashList recycling reuses this instance for different assets, so the async and retry
    // state is keyed by the asset and discarded on mismatch to never render a stale icon
    const key = contractAddress ? `${networkSymbol}:${contractAddress}` : networkSymbol;
    // size is part of the source identity because it is encoded in the CDN filename
    const asyncKey = `${key}#${sizeNumber}`;

    const [loadState, setLoadState] = useState<{
        sourceKey: string;
        logoIndex: number;
        failed: boolean;
    } | null>(null);

    const [displayedSource, setDisplayedSource] = useState<string>();

    // Native icons resolve synchronously; token logos may need asynchronous address resolution.
    const resolvedUrls = useAsyncMemo((): (string | number)[] | Promise<(string | number)[]> => {
        const fallbackIcon = contractAddress
            ? []
            : [cryptoIcons[networkSymbol.toLowerCase() as CryptoIconName]];

        if (!isNetworkSymbol(networkSymbol)) {
            return fallbackIcon;
        }

        const coingeckoId = getCoingeckoId(networkSymbol);
        if (!coingeckoId || !contractAddress) {
            return fallbackIcon;
        }

        const toLogoUrls = (logoAddresses: string[] | undefined) =>
            logoAddresses?.length
                ? logoAddresses.map(address =>
                      getAssetLogoUrl({
                          coingeckoId,
                          contractAddress: address,
                          density: 2,
                          size: sizeNumber,
                      }),
                  )
                : fallbackIcon;

        const logoAddresses = getAssetLogoContractAddresses(networkSymbol, contractAddress);

        return logoAddresses instanceof Promise
            ? logoAddresses.then(toLogoUrls)
            : toLogoUrls(logoAddresses);
    }, [contractAddress, sizeNumber, networkSymbol]);

    const sourceUrls = resolvedUrls ?? [];
    const sourceKey = resolvedUrls ? `${asyncKey}#resolved` : `${asyncKey}#fallback`;
    const logoIndex = loadState?.sourceKey === sourceKey ? loadState.logoIndex : 0;
    const imageKey = `${sourceKey}#${logoIndex}`;
    const placeholderText = contractAddress
        ? tokenSymbol?.trim() || 'T'
        : networkSymbol.toUpperCase();
    const showPlaceholder =
        !sourceUrls.length || (loadState?.sourceKey === sourceKey ? loadState.failed : false);

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
                placeholder={placeholderText}
                accessibilityLabel={key}
                containerStyle={iconContainerStyle}
            />
        );
    }

    return (
        <View style={iconContainerStyle}>
            <Image
                key={imageKey}
                source={sourceUrls[logoIndex]}
                accessibilityHint={translate('icons.tokenIconHint')}
                accessibilityLabel={key}
                recyclingKey={imageKey}
                style={iconContainerStyle}
                onDisplay={contractAddress ? () => setDisplayedSource(imageKey) : undefined}
                onError={handleLoadError}
                cachePolicy="memory-disk"
            />
            {/* Keep the image mounted so it can load underneath the token's initials. */}
            {!!contractAddress && displayedSource !== imageKey && (
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    <TokenIconPlaceholder
                        placeholder={placeholderText}
                        containerStyle={iconContainerStyle}
                    />
                </View>
            )}
        </View>
    );
};

export const TokenIcon = ({
    networkSymbol,
    contractAddress,
    tokenSymbol,
    showNetworkIcon = false,
    size = 'small',
    wrappedTokenIcon = 'token',
}: TokenIconProps) => {
    const { applyStyle } = useNativeStyles();

    if (
        wrappedTokenIcon === 'network' &&
        isNetworkSymbol(networkSymbol) &&
        isWrappedNativeToken(networkSymbol, contractAddress)
    ) {
        contractAddress = undefined;
    }

    if (!showNetworkIcon || !isNetworkSymbol(networkSymbol)) {
        return (
            <TokenIconComponent
                networkSymbol={networkSymbol}
                contractAddress={contractAddress}
                tokenSymbol={tokenSymbol}
                size={size}
            />
        );
    }

    const displaySymbol = getNetworkDisplaySymbol(networkSymbol);
    const showForNativeToken = displaySymbol === 'ETH' && networkSymbol !== 'eth';
    const shouldShowNetwork =
        showForNativeToken || contractAddress || wrappedTokenIcon === 'network';

    const iconSymbol = contractAddress ? networkSymbol : displaySymbol;
    const iconSize = typeof size === 'number' ? size : tokenIconSizes[size];

    return (
        <View style={{ width: iconSize, height: iconSize }}>
            <TokenIconComponent
                networkSymbol={iconSymbol}
                contractAddress={contractAddress}
                tokenSymbol={tokenSymbol}
                showNetworkIcon={showNetworkIcon}
                size={size}
            />
            {shouldShowNetwork && (
                <View style={applyStyle(networkWrapperStyle, { size: iconSize })}>
                    <NetworkIcon symbol={networkSymbol} size={size} />
                </View>
            )}
        </View>
    );
};
