import styled from 'styled-components/native';

import PropTypes from 'prop-types';
import React from 'react';
import { GestureResponderEvent } from 'react-native';
import colors from '../../config/colors';

import TopIcon from './icons/top';

// TODO: rewrite animations using Animated API

const TouchableWithoutFeedback = styled.TouchableWithoutFeedback``;

interface Props {
    icon: string | React.Component;
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
            <TopIcon width={size} height={size} color={color} />
        </TouchableWithoutFeedback>
    );
};

Icon.propTypes = {
    icon: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired,
    size: PropTypes.number,
    color: PropTypes.string,
    onClick: PropTypes.func,
};

export default Icon;
