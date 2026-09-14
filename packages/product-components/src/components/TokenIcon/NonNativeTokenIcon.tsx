import { useEffect, useMemo, useState } from 'react';

import styled, { css } from 'styled-components';

import { isNetworkIconSymbol } from '@suite-common/icons';
import { getAssetLogoUrl } from '@trezor/asset-utils';
import {
    type AllowedFrameProps,
    type TransientProps,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '@trezor/components';

import { TokenInitials } from './TokenInitials';
import { type TokenIconProps, allowedTokenIconFrameProps } from './tokenIconTypes';
import {
    type LogoCandidate,
    ZERO_ADDRESS,
    failedAddressesCache,
    makeAddressKey,
    makeCacheKey,
    resolvedLogoCache,
} from './tokenIconUtils';
import { NetworkIconBadge } from '../NetworkIcon/NetworkIconBadge';

const Container = styled.div<TransientProps<AllowedFrameProps> & { $size: number }>`
    ${({ $size }) => `
        width: ${$size}px;
        height: ${$size}px;
        position: relative;
    `}
    ${withFrameProps}
`;

const LogoWrapper = styled.div<{ $size: number; $isBordered: boolean }>`
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    border-radius: calc(infinity * 1px);
    overflow: hidden;

    ${({ $isBordered }) =>
        $isBordered &&
        css`
            box-shadow: ${({ theme }) => theme.elementShadowElevated};
        `}
`;

const Logo = styled.img<{ $size: number; $isTransparent: boolean }>`
    display: block;
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    border-radius: calc(infinity * 1px);
    background-color: ${({ theme, $isTransparent }) =>
        $isTransparent ? 'transparent' : theme.elementFillElevated};
`;

const EMPTY_CONTRACT_ADDRESSES: readonly string[] = [ZERO_ADDRESS];

type NonNativeTokenIconProps = TokenIconProps & {
    coingeckoId: string;
};

export const NonNativeTokenIcon = ({
    symbol,
    contractAddresses = EMPTY_CONTRACT_ADDRESSES,
    coingeckoId,
    size = 32,
    showNetworkIcon = false,
    shouldTryToFetch = true,
    placeholderWithTooltip = true,
    placeholder = '',
    customLogoUrl,
    isBordered = true,
    isTransparent = false,
    'data-testid': dataTestId,
    ...rest
}: NonNativeTokenIconProps) => {
    const canonicalAddresses = useMemo(() => {
        const set = new Set<string>();
        for (const addr of contractAddresses) {
            if (addr) set.add(addr);
        }

        return Array.from(set).sort();
    }, [contractAddresses]);

    const addressesKey = useMemo(() => canonicalAddresses.join('|'), [canonicalAddresses]);

    const cacheKey = useMemo(
        () => makeCacheKey(coingeckoId, addressesKey),
        [coingeckoId, addressesKey],
    );

    const [candidateIndex, setCandidateIndex] = useState(0);
    const [showPlaceholder, setShowPlaceholder] = useState(!shouldTryToFetch);

    const candidates = useMemo<LogoCandidate[]>(() => {
        if (!shouldTryToFetch) return [];

        const result: LogoCandidate[] = [];

        if (
            customLogoUrl &&
            !failedAddressesCache.has(makeAddressKey(coingeckoId, customLogoUrl))
        ) {
            result.push({
                address: customLogoUrl,
                src: customLogoUrl,
                srcSet: customLogoUrl,
            });
        }

        if (!canonicalAddresses.length) return result;

        const filtered = canonicalAddresses.filter(
            address => !failedAddressesCache.has(makeAddressKey(coingeckoId, address)),
        );

        const hasNative = filtered.includes(ZERO_ADDRESS);

        for (const address of filtered) {
            const url1x = getAssetLogoUrl({
                coingeckoId,
                contractAddress: !hasNative ? address : undefined,
                density: 1,
                size,
            });
            const url2x = getAssetLogoUrl({
                coingeckoId,
                contractAddress: !hasNative ? address : undefined,
                density: 2,
                size,
            });

            result.push({ address, src: url1x, srcSet: `${url1x} 1x, ${url2x} 2x` });
        }

        if (!hasNative && !failedAddressesCache.has(makeAddressKey(coingeckoId, ZERO_ADDRESS))) {
            const url1x = getAssetLogoUrl({
                coingeckoId,
                density: 1,
                size,
            });
            const url2x = getAssetLogoUrl({
                coingeckoId,
                density: 2,
                size,
            });

            result.push({
                address: ZERO_ADDRESS,
                src: url1x,
                srcSet: `${url1x} 1x, ${url2x} 2x`,
            });
        }

        return result;
    }, [shouldTryToFetch, canonicalAddresses, coingeckoId, size, customLogoUrl]);

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

    const frameProps = pickAndPrepareFrameProps(rest, allowedTokenIconFrameProps);

    const handleLoadError = () => {
        if (!current) return;

        failedAddressesCache.add(makeAddressKey(coingeckoId, current.address));

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

    const logo = (
        <>
            {showPlaceholder && (
                <TokenInitials size={size} withTooltip={placeholderWithTooltip}>
                    {placeholder}
                </TokenInitials>
            )}
            {!showPlaceholder && current && (
                <LogoWrapper $size={size} $isBordered={isBordered}>
                    <Logo
                        src={current.src}
                        srcSet={current.srcSet}
                        loading="lazy"
                        decoding="async"
                        $size={size}
                        $isTransparent={isTransparent}
                        data-testid={dataTestId}
                        alt={placeholder}
                        onLoad={handleOnLoad}
                        onError={handleLoadError}
                    />
                </LogoWrapper>
            )}
        </>
    );

    return (
        <Container $size={size} {...frameProps}>
            {showNetworkIcon && symbol && isNetworkIconSymbol(symbol) ? (
                <NetworkIconBadge networkSymbol={symbol} parentSize={size}>
                    {logo}
                </NetworkIconBadge>
            ) : (
                logo
            )}
        </Container>
    );
};
