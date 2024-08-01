import { Dispatch, SetStateAction, SVGProps, useCallback, useEffect, useState } from 'react';
import { motion, AnimationProps, SVGMotionProps } from 'framer-motion';
import styled, { useTheme } from 'styled-components';
import { borders, coinsColors, spacingsPx } from '@trezor/theme';
import { motionEasing } from '../../../config/motion';
import { getDominantColor } from '../../../utils/getDominantColor';
import { AssetLogo, AssetLogoProps, QUALITY_SIZE, useAssetUrl } from '../AssetLogo/AssetLogo';

const Container = styled.div<{ $size: number }>`
    position: relative;
    align-items: center;
    display: flex;
    justify-content: center;
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    border-radius: ${borders.radii.full};
    margin: ${spacingsPx.xxs};
`;

const loadImageAndProcessColor = (
    image: HTMLImageElement,
    size: number,
    onSetColor: Dispatch<SetStateAction<string | undefined>>,
) => {
    const canvas = document.createElement('canvas');
    const canvasContext = canvas.getContext('2d');

    if (image && canvasContext) {
        try {
            canvas.width = size;
            canvas.height = size;
            canvasContext.drawImage(image, 0, 0, size, size);

            const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);

            onSetColor(getDominantColor(imageData));
        } catch (error) {
            console.error('Error processing image color:', error);
            onSetColor(undefined);
        }
    }
};

export interface AssetShareIndicatorProps extends AssetLogoProps {
    percentageShare?: number;
}

interface ProgressCircleProps
    extends Pick<AssetShareIndicatorProps, 'symbol' | 'percentageShare' | 'index'> {
    iconUrl?: string;
    size: number;
}

const ProgressCircle = ({
    symbol,
    iconUrl,
    size,
    percentageShare,
    index = 0,
}: ProgressCircleProps) => {
    const theme = useTheme();
    const [dominantColor, setDominantColor] = useState<string | undefined>();

    const handleImageLoad = useCallback(
        (image: HTMLImageElement) => {
            loadImageAndProcessColor(image, size * 2, setDominantColor); // process color from bigger image to get more accurate result for dominant color
        },
        [size, setDominantColor],
    );

    const handleImageError = useCallback((error: ErrorEvent) => {
        console.error('Error loading image:', error.message);
    }, []);

    useEffect(() => {
        if (!symbol && iconUrl) {
            const image = new Image();
            image.crossOrigin = 'anonymous';

            const onImageLoad = () => handleImageLoad(image);
            const onImageError = handleImageError;

            image.src = iconUrl;

            image.addEventListener('load', onImageLoad);
            image.addEventListener('error', onImageError);

            return () => {
                image.removeEventListener('load', onImageLoad);
                image.removeEventListener('error', onImageError);
            };
        }
    }, [handleImageError, handleImageLoad, iconUrl, size, symbol]);

    const dimensions = size * 2;
    const strokeColor =
        symbol && coinsColors[symbol] ? coinsColors[symbol] : dominantColor || theme.iconSubdued;
    const viewBox = `0 0 ${dimensions} ${dimensions}`;

    const strokeWidth = dimensions / 6;
    const radius = (dimensions - strokeWidth) / 2;
    const circumference = Math.ceil(2 * Math.PI * radius);
    const fillPercents =
        percentageShare !== undefined
            ? Math.abs(Math.ceil((circumference / 100) * (percentageShare - 100)))
            : undefined;

    const svgProps: SVGProps<SVGSVGElement> = {
        viewBox,
        width: dimensions,
        height: dimensions,
    };

    const circleConfig: SVGMotionProps<SVGCircleElement> = {
        cx: size,
        cy: size,
        r: radius,
        fill: 'transparent',
        strokeWidth,
    };

    const delayModifier = 0.13;
    const transition: AnimationProps['transition'] = {
        duration: 0.8,
        ease: motionEasing.transition,
        delay: index * delayModifier,
    };

    return (
        <>
            {/* background circle */}
            <svg
                {...svgProps}
                style={{
                    position: 'absolute',
                }}
            >
                <motion.circle {...circleConfig} stroke={theme.backgroundSurfaceElevation0} />
            </svg>

            {/* moving circle */}
            <svg
                {...svgProps}
                style={{
                    position: 'absolute',
                    transform: 'rotate(-90deg)',
                }}
            >
                <motion.circle
                    {...circleConfig}
                    stroke={strokeColor}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference}
                    animate={{
                        strokeDashoffset: fillPercents,
                    }}
                    transition={transition}
                />
            </svg>
        </>
    );
};

export const AssetShareIndicator = ({
    symbol,
    className,
    size = 32,
    percentageShare,
    index,
    coingeckoId = '',
    contractAddress,
    quality = 'medium',
    ...rest
}: AssetShareIndicatorProps) => {
    const iconUrl = useAssetUrl(coingeckoId, contractAddress);
    const assetLogoSize = symbol ? size : QUALITY_SIZE[quality];
    const containerSize = assetLogoSize * 2;

    return (
        <Container className={className} $size={containerSize}>
            <AssetLogo
                symbol={symbol}
                size={assetLogoSize}
                coingeckoId={coingeckoId}
                contractAddress={contractAddress}
                quality={quality}
                {...rest}
            />
            <ProgressCircle
                symbol={symbol}
                iconUrl={iconUrl}
                size={assetLogoSize}
                percentageShare={percentageShare}
                index={index}
            />
        </Container>
    );
};
