/* eslint-disable global-require */
import styled from 'styled-components/native';

import React from 'react';
import { GestureResponderEvent } from 'react-native';
import SvgUri from 'react-native-svg-uri';
import colors from '../../config/colors';
import { IconType } from '../../support/types';
import { ICONS } from './icons';

// TODO: rewrite animations using Animated API

const TouchableWithoutFeedback = styled.TouchableWithoutFeedback``;

interface Props {
    icon: IconType;
    size?: number;
    color: string;
    onClick?: (event: GestureResponderEvent) => void;
}

const Icon = ({ icon, size = 24, color = colors.TEXT_SECONDARY, onClick }: Props) => {
    return (
        <TouchableWithoutFeedback
            onPress={onClick}
            style={{
                width: size,
                height: size,
            }}
        >
            <SvgUri width={size} height={size} fill={color} source={ICONS[icon]} />
        </TouchableWithoutFeedback>
    );
};

export { Icon, Props as IconProps };
