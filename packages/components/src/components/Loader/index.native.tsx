import React from 'react';
import styled from 'styled-components/native';
import PropTypes from 'prop-types';
import Svg, { Circle } from 'react-native-svg';

import { Animated, Easing } from 'react-native';
import colors from '../../config/colors';
import { FONT_SIZE_NATIVE } from '../../config/variables';

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

class Loader extends React.Component<Props> {
    state = {
        spinValue: new Animated.Value(0),
    };

    static propTypes = {
        className: PropTypes.string,
        text: PropTypes.string,
        isWhiteText: PropTypes.bool,
        isSmallText: PropTypes.bool,
        transparentRoute: PropTypes.bool,
        size: PropTypes.number,
        width: PropTypes.number,
        strokeWidth: PropTypes.number,
        // eslint-disable-next-line react/forbid-prop-types
        animationColor: PropTypes.object,
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

        const halfSize = size / 2;

        const spin = this.state.spinValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
        });

        // TODO: fix dasharray animation - https://stackoverflow.com/questions/46142291/animating-react-native-svg-dash-length-of-a-circle
        const dasharray = this.state.spinValue.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [89, 200, 89],
        });

        const dashoffset = this.state.spinValue.interpolate({
            inputRange: [0, 0.25, 0.5, 0.75, 1],
            outputRange: [0, -35, -124, -35, 0],
        });

        return (
            <Wrapper className={className} size={size} {...rest}>
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
                        r={halfSize}
                        fill="none"
                        stroke={transparentRoute ? 'transparent' : colors.GRAY_LIGHT}
                        strokeWidth={strokeWidth}
                    />
                    <AnimatedCircle
                        cx={halfSize}
                        cy={halfSize}
                        r={halfSize}
                        fill="none"
                        stroke={colors.GREEN_PRIMARY}
                        strokeWidth={strokeWidth}
                        strokeDashoffset={dashoffset}
                        strokeDasharray={dasharray}
                        strokeLinecap="round"
                    />
                </SvgWrapper>
            </Wrapper>
        );
    }
}

export default Loader;
