import styled from 'styled-components/native';

import PropTypes from 'prop-types';
import React from 'react';
// eslint-disable-next-line import/no-named-as-default
import Svg, { Path } from 'react-native-svg';
import { GestureResponderEvent } from 'react-native';
import colors from '../../config/colors';
import icons from '../../config/icons';
import { Omit, IconShape } from '../../support/types';

// TODO: rewrite animations using Animated API

const TouchableWithoutFeedback = styled.TouchableWithoutFeedback``;

type WrapperProps = Omit<Props, 'icon' | 'size'>;
interface Props {
    icon: string | IconShape;
    size?: number;
    color: string;
    isActive?: boolean;
    onClick?: (event: GestureResponderEvent) => void;
}

const Icon = ({ icon, size = 24, color = colors.TEXT_SECONDARY, onClick, ...rest }: Props) => {
    // if string is passed to the icon prop use it as a key in icons object
    const iconObject: IconShape = typeof icon === 'string' ? icons[icon] : icon;
    if (!iconObject) return null;
    return (
        <TouchableWithoutFeedback onPress={onClick}>
            <Svg
                width={`${size * (iconObject.ratio || 1)}`}
                height={`${size}`}
                viewBox={iconObject.viewBox || '0 0 1024 1024'}
                color={color}
                {...rest}
            >
                {iconObject.paths.map((path: string) => (
                    <Path key={path} fill={color} d={path} />
                ))}
            </Svg>
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
