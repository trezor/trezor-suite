import { useEffect, useMemo, useState } from 'react';

import styled, { css } from 'styled-components';

import {
    type AllowedFrameProps,
    type TransientProps,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '@trezor/components';

import { TokenInitials } from './TokenInitials';
import { type TokenIconProps, allowedTokenIconFrameProps } from './tokenIconTypes';
import { failedAddressesCache, resolvedLogoCache } from './tokenIconUtils';

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

type NonNativeTokenIconProps = TokenIconProps & { sources: NonNullable<TokenIconProps['sources']> };

export const NonNativeTokenIcon = ({
    sources,
    size = 32,
    shouldTryToFetch = true,
    placeholderWithTooltip = true,
    placeholder = '',
    isBordered = true,
    isTransparent = false,
    'data-testid': dataTestId,
    ...rest
}: NonNativeTokenIconProps) => {
    const cacheKey = JSON.stringify(sources);
    const [candidateIndex, setCandidateIndex] = useState(0);
    const [showPlaceholder, setShowPlaceholder] = useState(!shouldTryToFetch);
    const candidates = useMemo(
        () =>
            shouldTryToFetch ? sources.filter(source => !failedAddressesCache.has(source.src)) : [],
        [sources, shouldTryToFetch],
    );

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

        failedAddressesCache.add(current.src);

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
            {logo}
        </Container>
    );
};
