import { type SVGProps } from 'react';

import { type SVGMotionProps, type Transition, motion } from 'framer-motion';
import styled, { useTheme } from 'styled-components';

import { motionEasing } from '@trezor/components';
import { type CSSColor } from '@trezor/theme';

import { TokenIcon } from '../TokenIcon/TokenIcon';
import { type TokenIconProps } from '../TokenIcon/tokenIconTypes';

const Container = styled.div`
    position: relative;
    align-items: center;
    display: flex;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
`;

export interface AssetShareIndicatorProps extends TokenIconProps {
    networkColor: CSSColor;
    percentageShare?: number;
    index?: number;
}

interface ProgressCircleProps extends Pick<
    AssetShareIndicatorProps,
    'networkColor' | 'percentageShare' | 'index'
> {
    size: number;
}

const ProgressCircle = ({
    networkColor,
    size,
    percentageShare,
    index = 0,
}: ProgressCircleProps) => {
    const theme = useTheme();

    const dimensions = size * 2;
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
    const transition: Transition = {
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
                <motion.circle {...circleConfig} stroke={theme.surfaceFillPage} />
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
                    stroke={networkColor}
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
    networkColor,
    size = 32,
    percentageShare,
    index,
    ...rest
}: AssetShareIndicatorProps) => (
    <Container>
        <TokenIcon symbol={symbol} size={size} {...rest} />
        <ProgressCircle
            networkColor={networkColor}
            size={size}
            percentageShare={percentageShare}
            index={index}
        />
    </Container>
);
