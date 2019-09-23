import React, { FunctionComponent, useState, useEffect } from 'react';
import styled from 'styled-components/native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Animated, Easing } from 'react-native';
import colors from '../../config/colors';
import { FONT_SIZE_NATIVE } from '../../config/variables';

const Wrapper = styled.View<WrapperProps>`
    flex: 1;
    justify-content: center;
    align-items: center;
    width: ${props => props.size};
    height: ${props => props.size};
    flex-direction: row;
`;

const SvgWrapper = Animated.createAnimatedComponent(Svg);

const AnimatedPath = Animated.createAnimatedComponent(Path);

const TextWrapper = styled.Text<Props>`
    flex: 1;
    align-items: center;
`;

const StyledText = styled.Text<Props>`
    text-align: center;
    font-size: ${props => (props.isSmallText ? FONT_SIZE_NATIVE.SMALL : FONT_SIZE_NATIVE.BIG)};
    color: ${props => (props.isWhiteText ? colors.WHITE : colors.TEXT_PRIMARY)};
`;

interface Props {
    className?: string;
    text?: string;
    isWhiteText?: boolean;
    isSmallText?: boolean;
    transparentRoute?: boolean;
    size?: number;
    width?: number;
    strokeWidth?: number;
    animationColor?: any;
}

interface WrapperProps {
    size: number;
}

interface CertesianProps {
    x: number;
    y: number;
}

const Loader: FunctionComponent<Props> = ({
    size = 100,
    text,
    isSmallText,
    isWhiteText = false,
    transparentRoute,
    strokeWidth = 2,
}) => {
    const progress = new Animated.Value(0);
    const halfSize = size / 2;
    const dRange = [];
    const iRange = [];
    const steps = 359;

    const polarToCartesian = (
        centerX: number,
        centerY: number,
        radius: number,
        angleInDegrees: number
    ): CertesianProps => {
        const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

        return {
            x: centerX + radius * Math.cos(angleInRadians),
            y: centerY + radius * Math.sin(angleInRadians),
        };
    };

    const describeArc = (
        x: number,
        y: number,
        radius: number,
        startAngle: number,
        endAngle: number
    ): string => {
        const start = polarToCartesian(x, y, radius, endAngle);
        const end = polarToCartesian(x, y, radius, startAngle);

        const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

        const d = [
            'M',
            start.x,
            start.y,
            'A',
            radius,
            radius,
            0,
            largeArcFlag,
            0,
            end.x,
            end.y,
        ].join(' ');

        return d;
    };

    for (let i = 0; i < steps; i++) {
        const startAngle = i < 180 ? 0 : 2 * (i - 180);
        const endAngle = i < 180 ? 2 * i : 360;

        dRange.push(describeArc(halfSize, halfSize, halfSize - strokeWidth, startAngle, endAngle));
        iRange.push(i / (steps - 1));
    }

    const d = progress.interpolate({
        inputRange: iRange,
        outputRange: dRange,
    });

    const spin = progress.interpolate({
        inputRange: [0, 1],
        outputRange: ['90deg', '450deg'],
    });

    const strokeColor = progress.interpolate({
        inputRange: [0, 0.4, 0.66, 1],
        outputRange: [
            colors.GREEN_PRIMARY,
            colors.GREEN_PRIMARY,
            colors.GREEN_SECONDARY,
            colors.GREEN_TERTIARY,
        ],
    });

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(progress, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.linear,
                }),
            ])
        ).start();
    });

    return (
        <Wrapper size={size}>
            <TextWrapper>
                <StyledText isSmallText={isSmallText} isWhiteText={isWhiteText}>
                    {text}
                </StyledText>
            </TextWrapper>
            <SvgWrapper
                width={size}
                height={size}
                style={{
                    transform: [{ rotate: spin }],
                    position: 'absolute',
                }}
            >
                <Circle
                    cx={halfSize}
                    cy={halfSize}
                    r={halfSize - strokeWidth}
                    fill="none"
                    stroke={transparentRoute ? 'transparent' : colors.GRAY_LIGHT}
                    strokeWidth={strokeWidth}
                />
                <AnimatedPath d={d} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" />
            </SvgWrapper>
        </Wrapper>
    );
};

export { Loader, Props as LoaderProps };
