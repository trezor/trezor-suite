import React from 'react';
import styled from 'styled-components/native';
import { Animated } from 'react-native';
import Icon from '../Icon';

import icons from '../../config/icons';
import { Omit, IconShape } from '../../support/types';
import colors from '../../config/colors';

// TODO: center pulse animation
const Pulse = styled.View<Omit<Props, 'model'>>`
    background-color: ${colors.GREEN_PRIMARY};
    opacity: 0.3;
    border-radius: 100;
    height: ${props => props.size};
    width: ${props => props.size};
`;

const IconWrapper = styled.View<Omit<Props, 'model'>>`
    height: ${props => props.size};
    width: ${props => props.size};
`;

const Wrapper = styled.View`
    flex: 1;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
`;

const ContentWrapper = styled.Text`
    color: ${colors.GREEN_PRIMARY};
    text-align: center;
    margin: 10px;
`;

const Animation = styled(Animated.View)`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
`;

const modelToIcon = (model: model) => {
    const mapping: { [key: number]: IconShape } = {
        1: icons.T1,
        2: icons.T2,
    };
    return mapping[model];
};

type model = 1 | 2;

interface Props {
    model: model;
    size?: number;
    children?: React.ReactNode;
}

class Prompt extends React.Component<Props> {
    state = {
        opacityAnim: new Animated.Value(0),
        scaleAnim: new Animated.Value(0),
    };

    componentDidMount() {
        const { opacityAnim, scaleAnim } = this.state;

        // TODO: make animation same as on web
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 250,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0,
                    duration: 250,
                }),

                Animated.timing(opacityAnim, {
                    toValue: 0.3,
                    duration: 250,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1.5,
                    duration: 250,
                }),

                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 250,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 4,
                    duration: 250,
                }),
            ])
        ).start();
    }

    render() {
        const { opacityAnim, scaleAnim } = this.state;

        return (
            <Wrapper>
                <IconWrapper size={this.props.size}>
                    <Animation
                        style={{
                            opacity: opacityAnim,
                            transform: [{ scaleX: scaleAnim }, { scaleY: scaleAnim }],
                        }}
                    >
                        <Pulse size={this.props.size} />
                    </Animation>
                    <Icon
                        icon={modelToIcon(this.props.model)}
                        size={this.props.size}
                        color={colors.GREEN_PRIMARY}
                    />
                </IconWrapper>
                <ContentWrapper>{this.props.children}</ContentWrapper>
            </Wrapper>
        );
    }
}

export default Prompt;
