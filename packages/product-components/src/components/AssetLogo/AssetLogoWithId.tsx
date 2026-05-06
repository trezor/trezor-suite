import { useEffect, useMemo, useState } from 'react';

import styled, { css } from 'styled-components';

import { type NetworkSymbol, type NetworkSymbolExtended } from '@suite-common/wallet-config';
import { getAssetLogoContractAddresses } from '@suite-common/wallet-utils/src/tokenUtils';
import { getAssetLogoUrl } from '@trezor/asset-utils';
import {
    ElevationUp,
    type FrameProps,
    type FramePropsKeys,
    type TransientProps,
    pickAndPrepareFrameProps,
    useElevation,
    withFrameProps,
} from '@trezor/components';
import {
    type Elevation,
    borders,
    mapElevationToBackground,
    mapElevationToBorder,
} from '@trezor/theme';

import { AssetInitials } from './AssetInitials';
import {
    type LogoCandidate,
    ZERO_ADDRESS,
    failedAddressesCache,
    getCoingeckoIdAndContractAddressIncludesNativeTokens,
    makeAddressKey,
    makeCacheKey,
    resolvedLogoCache,
} from './assetLogoUtils';
import { type LegacyNetworkSymbol } from '../../constants/networks';
import { NetworkIcon } from '../NetworkIcon/NetworkIcon';

export const allowedAssetLogoSizes = [20, 24, 32, 40] as const satisfies number[];
export type AssetLogoSize = (typeof allowedAssetLogoSizes)[number];

export const allowedAssetLogoFrameProps = ['margin'] as const satisfies FramePropsKeys[];
export type AllowedFrameProps = Pick<FrameProps, (typeof allowedAssetLogoFrameProps)[number]>;

type AssetLogoBaseProps = AllowedFrameProps & {
    size: AssetLogoSize;
    contractAddress?: string | null;
    shouldTryToFetch?: boolean;
    placeholderWithTooltip?: boolean;
    placeholder?: string;
    'data-testid'?: string;
    showNetworkIcon?: boolean;
    customLogoUrl?: string;
    isBordered?: boolean;
};

export type AssetLogoProps = AssetLogoBaseProps & {
    symbol: NetworkSymbolExtended;
};

export type AssetLogoWithIdProps = AssetLogoBaseProps & {
    coingeckoId: string;
    symbol?: NetworkSymbolExtended;
};

const Container = styled.div<TransientProps<AllowedFrameProps> & { $size: number }>`
    ${({ $size }) => `
        width: ${$size}px;
        height: ${$size}px;
        position: relative;
    `}
    ${withFrameProps}
`;

const Logo = styled.img<{ $size: number; $elevation: Elevation; $isBordered: boolean }>`
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    border-radius: ${borders.radii.full};
    ${({ $isBordered }) =>
        $isBordered &&
        css<{ $elevation: Elevation }>`
            box-shadow: inset 0 0 0 1px ${mapElevationToBorder};
            background-color: ${mapElevationToBackground};
        `}
`;

const StyledNetworkIcon = styled(NetworkIcon)`
    position: absolute;
    bottom: 0;
    right: 0;
    line-height: 0;
`;

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    $size: number;
    $isBordered: boolean;
}

const ElevatedLogo = (props: LogoProps) => {
    const { elevation } = useElevation();

    return <Logo {...props} $elevation={elevation} />;
};

export const AssetLogoWithId = ({
    size,
    coingeckoId,
    symbol,
    contractAddress = null,
    shouldTryToFetch = true,
    placeholder = '',
    placeholderWithTooltip = true,
    showNetworkIcon = false,
    customLogoUrl,
    isBordered = true,
    'data-testid': dataTest,
    ...rest
}: AssetLogoWithIdProps) => {
    const contractAddressArray = useMemo(
        () => getAssetLogoContractAddresses(symbol, contractAddress),
        [symbol, contractAddress],
    );

    const normalizedAddresses = useMemo(
        () =>
            getCoingeckoIdAndContractAddressIncludesNativeTokens(coingeckoId, contractAddressArray),
        [coingeckoId, contractAddressArray],
    );
    const { coingeckoId: coingeckoIdLogo, contractAddresses } = normalizedAddresses;

    const canonicalAddresses = useMemo(() => {
        const set = new Set<string>();
        for (const addr of contractAddresses) {
            if (addr) set.add(addr);
        }

        return Array.from(set).sort();
    }, [contractAddresses]);

    const addressesKey = useMemo(() => canonicalAddresses.join('|'), [canonicalAddresses]);

    const cacheKey = useMemo(
        () => makeCacheKey(coingeckoIdLogo, addressesKey),
        [coingeckoIdLogo, addressesKey],
    );

    const [candidateIndex, setCandidateIndex] = useState(0);
    const [showPlaceholder, setShowPlaceholder] = useState(!shouldTryToFetch);

    const candidates = useMemo<LogoCandidate[]>(() => {
        if (!shouldTryToFetch) return [];

        const result: LogoCandidate[] = [];

        if (
            customLogoUrl &&
            !failedAddressesCache.has(makeAddressKey(coingeckoIdLogo, customLogoUrl))
        ) {
            result.push({
                address: customLogoUrl,
                src: customLogoUrl,
                srcSet: customLogoUrl,
            });
        }

        if (!canonicalAddresses.length) return result;

        const filtered = canonicalAddresses.filter(
            address => !failedAddressesCache.has(makeAddressKey(coingeckoIdLogo, address)),
        );

        const hasNative = filtered.some(addr => addr === ZERO_ADDRESS);

        for (const address of filtered) {
            const url1x = getAssetLogoUrl({
                coingeckoId: coingeckoIdLogo,
                contractAddress: !hasNative ? address : undefined,
                density: 1,
                size,
            });
            const url2x = getAssetLogoUrl({
                coingeckoId: coingeckoIdLogo,
                contractAddress: !hasNative ? address : undefined,
                density: 2,
                size,
            });

            result.push({ address, src: url1x, srcSet: `${url1x} 1x, ${url2x} 2x` });
        }

        return result;
    }, [shouldTryToFetch, canonicalAddresses, coingeckoIdLogo, size, customLogoUrl]);

    const hasCandidates = candidates.length > 0;
    const hasValidIndex = candidateIndex >= 0 && candidateIndex < candidates.length;
    const current = hasCandidates && hasValidIndex ? candidates[candidateIndex] : undefined;

    useEffect(() => {
        if (!hasCandidates) {
            setShowPlaceholder(true);

            return;
        }

        const cachedResult = resolvedLogoCache.get(cacheKey);
        if (!cachedResult) {
            setCandidateIndex(0);
            setShowPlaceholder(false);

            return;
        }

        const idx = candidates.findIndex(
            c => c.src === cachedResult.src && c.srcSet === cachedResult.srcSet,
        );
        setCandidateIndex(idx >= 0 ? idx : 0);
        setShowPlaceholder(false);
    }, [cacheKey, candidates, hasCandidates]);

    const frameProps = pickAndPrepareFrameProps(rest, allowedAssetLogoFrameProps);

    const handleLoadError = () => {
        if (!current) return;

        failedAddressesCache.add(makeAddressKey(coingeckoIdLogo, current.address));

        const nextIndex = candidateIndex + 1;
        if (nextIndex >= candidates.length) {
            setShowPlaceholder(true);
        } else {
            setCandidateIndex(nextIndex);
        }
    };

    const handleOnLoad = () => {
        if (!current) return;

        resolvedLogoCache.set(cacheKey, current);
    };

    return (
        <Container $size={size} {...frameProps}>
            {showPlaceholder && (
                <AssetInitials size={size} withTooltip={placeholderWithTooltip}>
                    {placeholder}
                </AssetInitials>
            )}
            {!showPlaceholder && current && (
                <ElevationUp>
                    <ElevatedLogo
                        src={current.src}
                        srcSet={current.srcSet}
                        loading="lazy"
                        decoding="async"
                        $size={size}
                        $isBordered={isBordered}
                        data-testid={dataTest}
                        alt={placeholder}
                        onLoad={handleOnLoad}
                        onError={handleLoadError}
                    />
                </ElevationUp>
            )}

            {showNetworkIcon && (
                <StyledNetworkIcon
                    networkSymbol={symbol as NetworkSymbol | LegacyNetworkSymbol}
                    size={size * 0.375}
                />
            )}
        </Container>
    );
};
