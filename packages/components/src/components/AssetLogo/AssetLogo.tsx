import styled from 'styled-components';
import { FrameProps, FramePropsKeys, withFrameProps } from '../../utils/frameProps';
import { SkeletonCircle } from '../skeletons/SkeletonCircle';
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

const Container = styled.div<TransientProps<AllowedFrameProps> & { $size: number }>(
    ({ $size }) => `
        width: ${$size}px;
        height: ${$size}px;

        ${withFrameProps}
    `,
);

const Logo = styled.img<{ $size: number; $isVisible: boolean }>(
    ({ $size, $isVisible }) => `
        width: ${$size}px;
        height: ${$size}px;
        border-radius: ${borders.radii.full};
        visibility: ${$isVisible ? 'visible' : 'hidden'};
    `,
);

export const AssetLogo = ({
    size,
    coingeckoId,
    contractAddress,
    shouldTryToFetch = true,
    placeholder,
    margin,
    'data-testid': dataTest,
}: AssetLogoProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isLogoRendered, setIsLogoRendered] = useState<boolean | null>(null);

    const fileName = contractAddress ? `${coingeckoId}--${contractAddress}` : coingeckoId;
    const getAssetLogoUrl = useCallback(
        (quality?: '@2x') =>
            `${ICONS_URL_BASE}${fileName}${quality === undefined ? '' : quality}.webp`,
        [fileName],
    );
    const logoUrl = getAssetLogoUrl();

    const isImageOnUrlExist = (url: string): Promise<boolean> => {
        return new Promise(resolve => {
            const img = new Image();
            img.src = url;

            if (img.complete) {
                resolve(true);
            } else {
                img.onload = () => {
                    resolve(true);
                };

                img.onerror = () => {
                    resolve(false);
                };
            }
        });
    };

    const hideLoading = () => {
        setIsLoading(false);
    };

    const frameProps = {
        margin,
    };

    useEffect(() => {
        const checkLogoExistence = async () => {
            const logoExists = await isImageOnUrlExist(logoUrl);
            setIsLogoRendered(logoExists);
        };

        if (shouldTryToFetch) {
            checkLogoExistence();
        } else {
            setIsLogoRendered(false);
        }
    }, [shouldTryToFetch, logoUrl, isLogoRendered]);

    const ContainerWithFrame = ({ children }: { children: React.ReactNode }) => (
        <Container $size={size} {...makePropsTransient(frameProps)}>
            {children}
        </Container>
    );

    return (
        <ContainerWithFrame>
            {isLoading && <SkeletonCircle size={size} />}

            {!isLoading && !isLogoRendered && (
                <AssetInitials size={size}>{placeholder}</AssetInitials>
            )}

            {isLogoRendered && (
                <Logo
                    src={logoUrl}
                    srcSet={`${logoUrl} 1x, ${getAssetLogoUrl('@2x')} 2x`}
                    $size={size}
                    onLoad={hideLoading}
                    onError={hideLoading}
                    $isVisible={isLoading === false}
                    data-testid={dataTest}
                    alt={placeholder}
                />
            )}
        </ContainerWithFrame>
    );
};
