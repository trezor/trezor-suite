import { SVGProps } from 'react';
import styled from 'styled-components';
import { CoinLogo, CoinLogoProps } from '../CoinLogo/CoinLogo';

const Container = styled.div`
    position: relative;
    align-items: center;
    display: flex;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
`;

export interface AssetShareIndicatorProps extends CoinLogoProps {
    percentageShare?: number;
}

interface ProgressCircleProps
    extends Pick<AssetShareIndicatorProps, 'symbol' | 'percentageShare' | 'index'> {
    size: number;
}

const ProgressCircle = ({ size }: ProgressCircleProps) => {
    // const theme = useTheme();

    const dimensions = size * 2;
    // const strokeColor = symbol && coinsColors[symbol] ? coinsColors[symbol] : theme.iconSubdued;
    const viewBox = `0 0 ${dimensions} ${dimensions}`;

    // const strokeWidth = dimensions / 6;
    // const radius = (dimensions - strokeWidth) / 2;
    // const circumference = Math.ceil(2 * Math.PI * radius);
    // const fillPercents =
    //     percentageShare !== undefined
    //         ? Math.abs(Math.ceil((circumference / 100) * (percentageShare - 100)))
    //         : undefined;

    const svgProps: SVGProps<SVGSVGElement> = {
        viewBox,
        width: dimensions,
        height: dimensions,
    };

    // const circleConfig: SVGMotionProps<SVGCircleElement> = {
    //     cx: size,
    //     cy: size,
    //     r: radius,
    //     fill: 'transparent',
    //     strokeWidth,
    // };

    // const transition: AnimationProps['transition'] = {
    //     duration: 0.8,
    //     ease: motionEasing.transition,
    //     delay: index * delayModifier,
    // };

    return (
        <>
            {/* background circle */}
            <svg
                {...svgProps}
                style={{
                    position: 'absolute',
                }}
            >
            </svg>

            {/* moving circle */}
            <svg
                {...svgProps}
                style={{
                    position: 'absolute',
                    transform: 'rotate(-90deg)',
                }}
            ></svg>
        </>
    );
};

export const AssetShareIndicator = ({
    symbol,
    className,
    size = 32,
    percentageShare,
    index,
    ...rest
}: AssetShareIndicatorProps) => (
    <Container className={className}>
        <CoinLogo symbol={symbol} size={size} {...rest} />
        <ProgressCircle
            symbol={symbol}
            size={size}
            percentageShare={percentageShare}
            index={index}
        />
    </Container>
);
