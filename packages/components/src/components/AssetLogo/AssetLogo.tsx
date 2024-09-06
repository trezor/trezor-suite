import styled from 'styled-components';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { useEffect, useState } from 'react';
import { borders } from '@trezor/theme';
import { AssetInitials } from './AssetInitials';
import { TransientProps } from '../../utils/transientProps';

const ICONS_URL_BASE = 'https://data.trezor.io/suite/icons/coins/';

export const allowedAssetLogoSizes = [20, 24];
type AssetLogoSize = (typeof allowedAssetLogoSizes)[number];

export const allowedAssetLogoFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedAssetLogoFrameProps)[number]>;

export type AssetLogoProps = AllowedFrameProps & {
    size: AssetLogoSize;
    coingeckoId: string;
    contractAddress?: string;
    shouldTryToFetch?: boolean;
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

const Logo = styled.img<{ $size: number; $isVisible: boolean }>(
    ({ $size, $isVisible }) => `
        width: ${$size}px;
        height: ${$size}px;
        border-radius: ${borders.radii.full};
        visibility: ${$isVisible ? 'visible' : 'hidden'};
    `,
);

const getAssetLogoUrl = (fileName: string, quality?: '@2x') =>
    `${ICONS_URL_BASE}${fileName}${quality === undefined ? '' : quality}.webp`;

export const AssetLogo = ({
    size,
    coingeckoId,
    contractAddress,
    shouldTryToFetch = true,
    placeholder,
    'data-testid': dataTest,
    ...rest
}: AssetLogoProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isPlaceholder, setIsPlaceholder] = useState(false);
    const fileName = contractAddress ? `${coingeckoId}--${contractAddress}` : coingeckoId;
    const logoUrl = getAssetLogoUrl(fileName);

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
            {isPlaceholder && <AssetInitials size={size}>{placeholder}</AssetInitials>}
            {!isPlaceholder && (
                <Logo
                    src={logoUrl}
                    srcSet={`${logoUrl} 1x, ${getAssetLogoUrl(fileName, '@2x')} 2x`}
                    $size={size}
                    onLoad={handleLoad}
                    onError={handleError}
                    $isVisible={!isLoading}
                    data-testid={dataTest}
                    alt={placeholder}
                    loading="lazy"
                />
            )}
        </Container>
    );
};
