import styled from 'styled-components';
import { FrameProps, FramePropsKeys, withFrameProps } from '../../utils/frameProps';
import { useCallback, useState } from 'react';
import { borders } from '@trezor/theme';
import { AssetInitials } from './AssetInitials';
import { useEffect } from 'react';
import { makePropsTransient, TransientProps } from '../../utils/transientProps';

const ICONS_URL_BASE = 'https://data.trezor.io/suite/icons/coins/';

export const allowedAssetLogoSizes = [20, 24];
type AssetLogoSize = (typeof allowedAssetLogoSizes)[number];

export const allowedAssetLogoFrameProps: FramePropsKeys[] = ['margin'];
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

const useAssetLogo = (logoUrl: string, shouldTryToFetch: boolean) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isPlaceholder, setIsPlaceholder] = useState<boolean | null>(null);

    const isImageOnUrlExist = useCallback((url: string): Promise<boolean> => {
        return new Promise(resolve => {
            const img = new Image();
            img.src = url;

            if (img.complete) {
                resolve(true);
            } else {
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
            }
        });
    }, []);

    useEffect(() => {
        const checkLogoExistence = async () => {
            const logoExists = await isImageOnUrlExist(logoUrl);
            setIsPlaceholder(!logoExists);
            setIsLoading(false);
        };

        if (shouldTryToFetch) {
            checkLogoExistence();
        } else {
            setIsPlaceholder(true);
            setIsLoading(false);
        }
    }, [shouldTryToFetch, logoUrl, isImageOnUrlExist]);

    return { isLoading, isPlaceholder, setIsLoading };
};

const getAssetLogoUrl = (fileName: string, quality?: '@2x') =>
    `${ICONS_URL_BASE}${fileName}${quality === undefined ? '' : quality}.webp`;

export const AssetLogo = ({
    size,
    coingeckoId,
    contractAddress,
    shouldTryToFetch = true,
    placeholder,
    margin,
    'data-testid': dataTest,
}: AssetLogoProps) => {
    const fileName = contractAddress ? `${coingeckoId}--${contractAddress}` : coingeckoId;
    const logoUrl = getAssetLogoUrl(fileName);

    const { isLoading, setIsLoading, isPlaceholder } = useAssetLogo(logoUrl, shouldTryToFetch);

    const frameProps = {
        margin,
    };

    const handleLoad = () => {
        setIsLoading(false);
    };
    const handleError = () => {
        setIsLoading(false);
    };

    return (
        <Container $size={size} {...makePropsTransient(frameProps)}>
            {(isLoading || isPlaceholder) && (
                <AssetInitials size={size}>{placeholder}</AssetInitials>
            )}
            {!isLoading && !isPlaceholder && (
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
