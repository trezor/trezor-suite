/* eslint-disable global-require */
import styled from 'styled-components/native';

import PropTypes from 'prop-types';
import React from 'react';
import { GestureResponderEvent } from 'react-native';
import SvgUri from 'react-native-svg-uri';
import colors from '../../config/colors';

// TODO: rewrite animations using Animated API

const TouchableWithoutFeedback = styled.TouchableWithoutFeedback``;

const LOGOS: { [key: string]: any } = {
    ARROW_DOWN: require('../../images/icons/arrow_down.svg'),
    ARROW_LEFT: require('../../images/icons/arrow_left.svg'),
    ARROW_UP: require('../../images/icons/arrow_up.svg'),
    BACK: require('../../images/icons/back.svg'),
    CHAT: require('../../images/icons/chat.svg'),
    CLOSE: require('../../images/icons/close.svg'),
    COG: require('../../images/icons/cog.svg'),
    DOWNLOAD: require('../../images/icons/download.svg'),
    EJECT: require('../../images/icons/eject.svg'),
    ERROR: require('../../images/icons/error.svg'),
    EYE_CROSSED: require('../../images/icons/eye_crossed.svg'),
    EYE: require('../../images/icons/eye.svg'),
    HELP: require('../../images/icons/help.svg'),
    INFO: require('../../images/icons/info.svg'),
    MENU: require('../../images/icons/menu.svg'),
    PLUS: require('../../images/icons/plus.svg'),
    QRCODE: require('../../images/icons/qrcode.svg'),
    REFRESH: require('../../images/icons/refresh.svg'),
    SKIP: require('../../images/icons/skip.svg'),
    SUCCESS: require('../../images/icons/success.svg'),
    T1: require('../../images/icons/t1.svg'),
    T2: require('../../images/icons/t2.svg'),
    TOP: require('../../images/icons/top.svg'),
    WALLET_HIDDEN: require('../../images/icons/wallet_hidden.svg'),
    WALLET_STANDARD: require('../../images/icons/wallet_standard.svg'),
    WARNING: require('../../images/icons/warning.svg'),
};

interface Props {
    icon: string;
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
            <SvgUri width={size} height={size} fill={color} source={LOGOS[icon]} />
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
