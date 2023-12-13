import { ImgHTMLAttributes, SVGProps } from 'react';
import { ReactSVG } from 'react-svg';
import { motion, AnimationProps } from 'framer-motion';
import styled, { useTheme } from 'styled-components';
import { coinsColors } from '@trezor/theme';
import { COINS } from './coins';
import { motionEasing } from '../../../config/motion';

export type CoinType = keyof typeof COINS;

const Container = styled.div`
    position: relative;
    align-items: center;
    display: flex;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
`;

const SvgWrapper = styled.div<Omit<CoinLogoProps, 'symbol'>>`
    display: inline-block;
    height: ${props => props.size}px;
    width: ${props => props.size}px;

    div {
        height: ${props => props.size}px;
        line-height: ${props => props.size}px;
    }
`;

interface ProgressCircleProps extends Pick<CoinLogoProps, 'symbol' | 'percentageShare' | 'index'> {
    size: number;
}

const ProgressCircle = ({ symbol, size, percentageShare, index = 0 }: ProgressCircleProps) => {
    const theme = useTheme();

    const dimensions = size * 2;
    const strokeColor = symbol && coinsColors[symbol] ? coinsColors[symbol] : theme.iconSubdued;
    const viewBox = `0 0 ${dimensions} ${dimensions}`;

    const strokeWidth = dimensions / 6;
    const radius = (dimensions - strokeWidth) / 2;
    const circumference = Math.ceil(2 * Math.PI * radius);
    const fillPercents = percentageShare
        ? Math.abs(Math.ceil((circumference / 100) * (percentageShare - 100)))
        : undefined;

    const svgProps: SVGProps<SVGSVGElement> = {
        viewBox,
        width: dimensions,
        height: dimensions,
    };

    const circleConfig = {
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

export interface CoinLogoProps extends ImgHTMLAttributes<HTMLImageElement> {
    symbol: CoinType;
    className?: string;
    size?: number;
    hasShareIndicator?: boolean;
    percentageShare?: number;
    index?: number;
}

const Logo = ({
    symbol,
    className,
    size = 32,
    hasShareIndicator = false,
    ...rest
}: CoinLogoProps) => (
    <SvgWrapper className={className} size={size} {...rest}>
        <ReactSVG
            src={COINS[symbol]}
            beforeInjection={svg => {
                svg.setAttribute('width', `${size}px`);
                svg.setAttribute('height', `${size}px`);
            }}
            loading={() => <span className="loading" />}
        />
    </SvgWrapper>
);

const CoinLogo = ({
    symbol,
    className,
    size = 32,
    hasShareIndicator = false,
    percentageShare,
    index,
    ...rest
}: CoinLogoProps) =>
    hasShareIndicator ? (
        <Container>
            <Logo symbol={symbol} className={className} size={size} hasShareIndicator {...rest} />
            <ProgressCircle
                symbol={symbol}
                size={size}
                percentageShare={percentageShare}
                index={index}
            />
        </Container>
    ) : (
        <Logo symbol={symbol} className={className} size={size} {...rest} />
    );

export { CoinLogo };
