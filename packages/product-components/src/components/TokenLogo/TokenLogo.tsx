import { useEffect, useMemo, useState } from 'react';
import { ReactSVG } from 'react-svg';

import styled, { css } from 'styled-components';

import {
    type NetworkIconSymbol,
    cryptoIcons,
    isCryptoIconSymbol,
    isNetworkIconSymbol,
} from '@suite-common/icons';
import {
    type NetworkSymbolExtended,
    getCoingeckoId,
    getNetworkOptional,
    isNetworkSymbol,
} from '@suite-common/wallet-config';
import { getAssetLogoContractAddresses } from '@suite-common/wallet-utils';
import { getAssetLogoUrl } from '@trezor/asset-utils';
import {
    type FrameProps,
    type FramePropsKeys,
    type TransientProps,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '@trezor/components';
import { borders } from '@trezor/theme';

import { TokenInitials } from './TokenInitials';
import {
    type LogoCandidate,
    ZERO_ADDRESS,
    failedAddressesCache,
    getCoingeckoIdAndContractAddressIncludesNativeTokens,
    makeAddressKey,
    makeCacheKey,
    resolvedLogoCache,
} from './tokenLogoUtils';
import { NetworkLogoBadge } from '../NetworkLogo/NetworkLogoBadge';

export const allowedTokenLogoSizes = [16, 20, 24, 32, 40, 48, 64] as const;
export type TokenLogoSize = (typeof allowedTokenLogoSizes)[number];

export const allowedTokenLogoFrameProps = ['margin'] as const satisfies FramePropsKeys[];
export type AllowedFrameProps = Pick<FrameProps, (typeof allowedTokenLogoFrameProps)[number]>;

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
    border-radius: ${borders.radii.full};
    overflow: hidden;

    ${({ $isBordered }) =>
        $isBordered &&
        css`
            box-shadow: ${({ theme }) => theme.elementShadowElevated};
        `}
`;

const Logo = styled.img<{ $size: number }>`
    display: block;
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    border-radius: ${borders.radii.full};
    background-color: ${({ theme }) => theme.elementFillElevated};
`;

export interface TokenLogoProps extends AllowedFrameProps {
    symbol: NetworkIconSymbol & NetworkSymbolExtended;
    contractAddress?: string | null;
    coingeckoId: string;
    size?: TokenLogoSize;
    shouldTryToFetch?: boolean;
    placeholderWithTooltip?: boolean;
    placeholder?: string;
    showNetworkIcon?: boolean;
    customLogoUrl?: string;
    isBordered?: boolean;
    'data-testid'?: string;
}

const AssetLogo = ({
    symbol,
    contractAddress,
    coingeckoId,
    size = 32,
    shouldTryToFetch = true,
    placeholderWithTooltip = true,
    placeholder = '',
    showNetworkIcon = false,
    customLogoUrl,
    isBordered = true,
    'data-testid': dataTest,
    ...rest
}: TokenLogoProps) => {
    const [contractAddressArray, setContractAddressArray] = useState<string[] | undefined>();

    useEffect(() => {
        getAssetLogoContractAddresses(symbol, contractAddress).then(setContractAddressArray);
    }, [symbol, contractAddress]);

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

        const hasNative = filtered.includes(ZERO_ADDRESS);

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

        if (
            !hasNative &&
            !failedAddressesCache.has(makeAddressKey(coingeckoIdLogo, ZERO_ADDRESS))
        ) {
            const url1x = getAssetLogoUrl({
                coingeckoId: coingeckoIdLogo,
                density: 1,
                size,
            });
            const url2x = getAssetLogoUrl({
                coingeckoId: coingeckoIdLogo,
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

    const frameProps = pickAndPrepareFrameProps(rest, allowedTokenLogoFrameProps);

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
                        data-testid={dataTest}
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
                <NetworkLogoBadge networkSymbol={symbol} parentSize={size}>
                    {logo}
                </NetworkLogoBadge>
            ) : (
                logo
            )}
        </Container>
    );
};

const SvgContainer = styled.div<{ $size: TokenLogoSize }>`
    display: flex;
    flex-shrink: 0;
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
`;

const StyledReactSVG = styled(ReactSVG)`
    display: flex;
    width: 100%;
    height: 100%;

    div {
        display: flex;
        width: 100%;
        height: 100%;
    }

    svg {
        display: block;
        width: 100%;
        height: 100%;
    }
` as typeof ReactSVG;

type TokenSvgProps = {
    src: string;
    size: TokenLogoSize;
    'data-testid'?: string;
};

const TokenSvg = ({ src, size, 'data-testid': dataTestId }: TokenSvgProps) => (
    <SvgContainer $size={size} data-testid={dataTestId}>
        <StyledReactSVG
            src={src}
            beforeInjection={svg => {
                svg.setAttribute('width', `${size}px`);
                svg.setAttribute('height', `${size}px`);
            }}
            loading={() => <span className="loading" />}
        />
    </SvgContainer>
);

interface NativeTokenLogoProps {
    symbol: NetworkIconSymbol & NetworkSymbolExtended;
    size?: TokenLogoSize;
    'data-testid'?: string;
}

const NativeTokenLogo = ({
    symbol,
    size = 32,
    'data-testid': dataTestId,
}: NativeTokenLogoProps) => (
    <TokenSvg src={cryptoIcons[symbol]} size={size} data-testid={dataTestId} />
);

export const TokenLogo = ({
    symbol,
    contractAddress,
    size = 32,
    showNetworkIcon = false,
    'data-testid': dataTestId,
    ...rest
}: Omit<TokenLogoProps, 'coingeckoId'>) => {
    if (!contractAddress) {
        if (showNetworkIcon) {
            const network = getNetworkOptional(symbol);
            const networkSymbol = network?.settlementLayer ?? symbol;
            const displaySymbol = networkSymbol !== symbol ? networkSymbol : symbol;
            const logo = (
                <NativeTokenLogo symbol={displaySymbol} size={size} data-testid={dataTestId} />
            );

            if (networkSymbol !== symbol && isNetworkIconSymbol(symbol)) {
                return (
                    <NetworkLogoBadge networkSymbol={symbol} parentSize={size}>
                        {logo}
                    </NetworkLogoBadge>
                );
            }

            return logo;
        }

        return <NativeTokenLogo symbol={symbol} size={size} data-testid={dataTestId} />;
    }

    const coingeckoId = isNetworkSymbol(symbol) ? getCoingeckoId(symbol) : undefined;

    if (!coingeckoId) {
        if (isCryptoIconSymbol(symbol)) {
            return <NativeTokenLogo symbol={symbol} size={size} data-testid={dataTestId} />;
        }

        return null;
    }

    return (
        <AssetLogo
            coingeckoId={coingeckoId}
            symbol={symbol}
            contractAddress={contractAddress}
            size={size}
            showNetworkIcon={showNetworkIcon}
            data-testid={dataTestId}
            {...rest}
        />
    );
};
