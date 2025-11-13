import { useEffect, useMemo, useState } from 'react';

import styled from 'styled-components';

// TODO: suite-common imports in non-suite packages should not be allowed
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { getNetwork, getNetworkByCoingeckoId, isNetworkSymbol } from '@suite-common/wallet-config';
import { getAssetLogoUrl, resolveAssetLogoSize } from '@trezor/asset-utils';
import { Elevation, borders, mapElevationToBackground, mapElevationToBorder } from '@trezor/theme';

import { AssetInitials } from './AssetInitials';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';
import { ElevationUp, useElevation } from '../ElevationContext/ElevationContext';

export const allowedAssetLogoSizes = [20, 24, 32, 40] as const;
type AssetLogoSize = (typeof allowedAssetLogoSizes)[number];

export const allowedAssetLogoFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedAssetLogoFrameProps)[number]>;

export type AssetLogoProps = AllowedFrameProps & {
    size: AssetLogoSize;
    coingeckoId: string;
    contractAddress?: string[];
    shouldTryToFetch?: boolean;
    placeholderWithTooltip?: boolean;
    placeholder: string;
    'data-testid'?: string;
};

type LogoCandidate = { address: string; src: string; srcSet: string };

const Container = styled.div<TransientProps<AllowedFrameProps> & { $size: number }>`
    ${({ $size }) => `
        width: ${$size}px;
        height: ${$size}px;
    `}
    ${withFrameProps}
`;

const Logo = styled.img<{ $size: number; $elevation: Elevation }>`
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    border-radius: ${borders.radii.full};
    box-shadow: inset 0 0 0 1px ${mapElevationToBorder};
    background-color: ${mapElevationToBackground};
`;

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    $size: number;
}

const ElevatedLogo = (props: LogoProps) => {
    const { elevation } = useElevation();

    return <Logo {...props} $elevation={elevation} />;
};

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const resolvedLogoCache = new Map<string, LogoCandidate>();
const failedAddressesCache = new Set<string>();

const makeCacheKey = (coingeckoId: string, addressesKey: string) =>
    `${coingeckoId}::${addressesKey}`;

const makeAddressKey = (coingeckoId: string, address: string) => `${coingeckoId}::${address}`;

export const getCoingeckoIdAndContractAddressIncludesNativeTokens = (
    coingeckoId: string,
    contractAddress: string[] | undefined,
) => {
    const mainNetworkSymbol = getNetworkByCoingeckoId(coingeckoId)?.displaySymbol;

    const addresses = ([] as Array<string | undefined>)
        .concat(contractAddress ?? [])
        .map(addr => addr ?? ZERO_ADDRESS);

    const hasNative = addresses.some(addr => addr === ZERO_ADDRESS);

    const shouldUseTradeId = hasNative && !!mainNetworkSymbol && isNetworkSymbol(mainNetworkSymbol);

    const resolvedCoingeckoId = shouldUseTradeId
        ? (getNetwork(mainNetworkSymbol).tradeCryptoId ?? coingeckoId)
        : coingeckoId;

    return {
        coingeckoId: resolvedCoingeckoId,
        contractAddresses: addresses.length ? addresses : [ZERO_ADDRESS],
    };
};

export const AssetLogo = ({
    size,
    coingeckoId,
    contractAddress,
    shouldTryToFetch = true,
    placeholder,
    placeholderWithTooltip = true,
    'data-testid': dataTest,
    ...rest
}: AssetLogoProps) => {
    const normalizedAddresses = useMemo(
        () => getCoingeckoIdAndContractAddressIncludesNativeTokens(coingeckoId, contractAddress),
        [coingeckoId, contractAddress],
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
        if (!shouldTryToFetch || !canonicalAddresses.length) return [];

        const filtered = canonicalAddresses.filter(
            address => !failedAddressesCache.has(makeAddressKey(coingeckoIdLogo, address)),
        );

        const hasNative = filtered.some(addr => addr === ZERO_ADDRESS);

        return filtered.map(address => {
            const url1x = getAssetLogoUrl({
                coingeckoId: coingeckoIdLogo,
                contractAddress: !hasNative ? address : undefined,
                quality: '1x',
                size: resolveAssetLogoSize(size),
            });
            const url2x = getAssetLogoUrl({
                coingeckoId: coingeckoIdLogo,
                contractAddress: !hasNative ? address : undefined,
                quality: '2x',
                size: resolveAssetLogoSize(size),
            });

            return { address, src: url1x, srcSet: `${url1x} 1x, ${url2x} 2x` };
        });
    }, [shouldTryToFetch, canonicalAddresses, coingeckoIdLogo, size]);

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
                        data-testid={dataTest}
                        alt={placeholder}
                        onLoad={handleOnLoad}
                        onError={handleLoadError}
                    />
                </ElevationUp>
            )}
        </Container>
    );
};
