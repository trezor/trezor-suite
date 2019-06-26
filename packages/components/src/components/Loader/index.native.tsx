import React from 'react';
import styled, { css } from 'styled-components/native';
import Svg, { Circle } from 'react-native-svg';

import { Animated, Easing } from 'react-native';
import { FONT_SIZE_NATIVE } from '../../config/variables';
import Paragraph from '../Paragraph';
import colors from '../../config/colors';

const Wrapper = styled.View<Props>`
    flex: 1;
    justify-content: center;
    align-items: center;
    width: ${props => props.size};
    height: ${props => props.size};
    flex-direction: row;
`;

const SvgWrapper = Animated.createAnimatedComponent(Svg);

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const StyledParagraph = styled(Paragraph)<Props>`
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
    strokeWidth?: number;
    animationColor?: any;
}

class Loader extends React.Component<Props> {
    state = {
        spinValue: new Animated.Value(0),
    };

    componentDidMount() {
        Animated.loop(
            Animated.sequence([
                Animated.timing(this.state.spinValue, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.linear,
                }),
            ])
        ).start();
    }

    render() {
        const {
            className,
            size = 100,
            text,
            animationColor,
            isSmallText,
            isWhiteText = false,
            transparentRoute,
            strokeWidth = 2,
            ...rest
        } = this.props;

        const spin = this.state.spinValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
        });

        const dasharray = this.state.spinValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['1 200', '89 200'],
        });

        return (
            <Wrapper className={className} size={size} {...rest}>
                {/* TODO: center text horizontally */}
                <StyledParagraph isSmallText={isSmallText} isWhiteText={isWhiteText}>
                    {text}
                </StyledParagraph>
                <SvgWrapper
                    viewBox="25 25 50 50"
                    style={{
                        transform: [{ rotate: spin }],
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <Circle
                        cx={50}
                        cy={50}
                        r={20}
                        fill="none"
                        stroke={transparentRoute ? 'transparent' : colors.GRAY_LIGHT}
                        strokeWidth={strokeWidth}
                    />
                    {/* TODO: animate dasharray from 1, 200 to 89, 200 */}
                    <AnimatedCircle
                        cx={50}
                        cy={50}
                        r={20}
                        fill="none"
                        stroke={colors.GREEN_PRIMARY}
                        strokeWidth={strokeWidth}
                        strokeDashoffset={0}
                        strokeLinecap="round"
                        style={{
                            strokeDasharray: dasharray,
                        }}
                    />
                </SvgWrapper>
            </Wrapper>
        );
    }
}

export default Loader;
