import { Dispatch, SetStateAction, SVGProps, useEffect, useState } from 'react';
import { motion, AnimationProps, SVGMotionProps } from 'framer-motion';
import styled, { useTheme } from 'styled-components';
import { coinsColors } from '@trezor/theme';
import { motionEasing } from '../../../config/motion';
import { CoinLogo, CoinLogoProps, QUALITY_SIZE, useAssetUrl } from '../CoinLogo/CoinLogo';

const Container = styled.div<{ $size: number }>(
    ({ $size }) => `
        position: relative;
        align-items: center;
        display: flex;
        justify-content: center;
        width: ${$size}px;
        height: ${$size}px;
        border-radius: 50%;
  `,
);

const rgbToHexColor = (rgbColor: string) => {
    const [r, g, b] = rgbColor.split('-').map(Number);
    const hex = [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');

    return '#' + hex;
};

const getDominantColor = (imageData: ImageData) => {
    const colorMap: { [key: string]: number } = {};
    const numberOfPixelValues = 4;
    let dominantKey = '';
    let maxCount = 0;

    for (let i = 0; i < imageData.data.length; i += numberOfPixelValues) {
        const red = imageData.data[i];
        const green = imageData.data[i + 1];
        const blue = imageData.data[i + 2];
        const alpha = imageData.data[i + 3];

        if (alpha !== 255) {
            continue; // ignore pixel with transparency
        }

        const imagePixelKey = `${red}-${green}-${blue}`;
        colorMap[imagePixelKey] = (colorMap[imagePixelKey] || 0) + 1;

        if (colorMap[imagePixelKey] > maxCount) {
            dominantKey = imagePixelKey;
            maxCount = colorMap[imagePixelKey];
        }
    }

    return rgbToHexColor(dominantKey);
};

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

export interface AssetShareIndicatorProps extends CoinLogoProps {
    percentageShare?: number;
    showProgressCircle?: boolean;
    firstCharacter?: string;
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

    useEffect(() => {
        if (!symbol && iconUrl) {
            const image = new Image();

            if (image) {
                image.crossOrigin = 'anonymous';
                image.onload = () => loadImageAndProcessColor(image, size, setDominantColor);

                image.onerror = error => {
                    console.error('Error loading image:', error);
                };

                image.src = iconUrl;

                return () => {
                    image.onload = null;
                };
            }
        }
    }, [iconUrl, size, symbol]);

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
    const coinLogoSize = !symbol ? QUALITY_SIZE[quality] : size;

    return (
        <Container className={className} $size={coinLogoSize * 2}>
            <CoinLogo
                symbol={symbol}
                size={coinLogoSize}
                coingeckoId={coingeckoId}
                contractAddress={contractAddress}
                quality={quality}
                {...rest}
            />
            <ProgressCircle
                symbol={symbol}
                iconUrl={iconUrl}
                size={coinLogoSize}
                percentageShare={percentageShare}
                index={index}
            />
        </Container>
    );
};
