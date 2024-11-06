import { useEffect, useState } from 'react';

import styled from 'styled-components';

import { borders, Elevation, mapElevationToBackground, mapElevationToBorder } from '@trezor/theme';
import { getAssetLogoUrl } from '@trezor/asset-utils';

import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { AssetInitials } from './AssetInitials';
import { TransientProps } from '../../utils/transientProps';
import { ElevationUp, useElevation } from '../ElevationContext/ElevationContext';

export const allowedAssetLogoSizes = [20, 24];
type AssetLogoSize = (typeof allowedAssetLogoSizes)[number];

export const allowedAssetLogoFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedAssetLogoFrameProps)[number]>;

export type AssetLogoProps = AllowedFrameProps & {
    size: AssetLogoSize;
    coingeckoId: string;
    contractAddress?: string;
    shouldTryToFetch?: boolean;
    placeholderWithTooltip?: boolean;
    placeholder: string;
    'data-testid'?: string;
};

const Container = styled.div<TransientProps<AllowedFrameProps> & { $size: number }>`
    ${({ $size }) => `
        width: ${$size}px;
        height: ${$size}px;
    `}
    ${withFrameProps}
`;

const Logo = styled.img<{ $size: number; $isVisible: boolean; $elevation: Elevation }>`
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    border-radius: ${borders.radii.full};
    visibility: ${({ $isVisible }) => ($isVisible ? 'visible' : 'hidden')};
    box-shadow: inset 0 0 0 1px ${mapElevationToBorder};
    background-color: ${mapElevationToBackground};
`;

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    $size: number;
    $isVisible: boolean;
}

const ElevatedLogo = (props: LogoProps) => {
    const { elevation } = useElevation();

    return <Logo {...props} $elevation={elevation} />;
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
    const [isLoading, setIsLoading] = useState(true);
    const [isPlaceholder, setIsPlaceholder] = useState(!shouldTryToFetch);

    const logoUrl = getAssetLogoUrl({ coingeckoId, contractAddress });
    const logoUrl2x = getAssetLogoUrl({ coingeckoId, contractAddress, quality: '@2x' });

    const frameProps = pickAndPrepareFrameProps(rest, allowedAssetLogoFrameProps);

    const handleLoad = () => {
        setIsLoading(false);
    };
    const handleError = () => {
        setIsPlaceholder(true);
    };
    useEffect(() => {
        setIsPlaceholder(!shouldTryToFetch);
    }, [shouldTryToFetch]);

    return (
        <Container $size={size} {...frameProps}>
            {isPlaceholder && (
                <AssetInitials size={size} withTooltip={placeholderWithTooltip}>
                    {placeholder}
                </AssetInitials>
            )}
            {!isPlaceholder && (
                <ElevationUp>
                    <ElevatedLogo
                        src={logoUrl}
                        srcSet={`${logoUrl} 1x, ${logoUrl2x} 2x`}
                        $size={size}
                        onLoad={handleLoad}
                        onError={handleError}
                        $isVisible={!isLoading}
                        data-testid={dataTest}
                        alt={placeholder}
                        loading="lazy"
                    />
                </ElevationUp>
            )}
        </Container>
    );
};
