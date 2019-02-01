/* @flow */

import React from 'react';
import PropTypes from 'prop-types';
import COLORS from 'config/colors';
import ICONS from 'config/icons';
import styled from 'styled-components';
import type { TrezorDevice } from 'flowtype';

type Props = {
    device: TrezorDevice,
    size?: number,
    color?: string,
    hoverColor?: string,
    onClick?: any,
}

const SvgWrapper = styled.svg`
    :hover {
        path {
            fill: ${props => props.hoverColor}
        }
    }
`;

const Path = styled.path`
    fill: ${props => props.color};
`;

const getDeviceIcon = (majorVersion: number) => {
    switch (majorVersion) {
        case 1:
            return ICONS.T1;
        case 2:
            return ICONS.T2;
        default:
            return ICONS.T2;
    }
};

const DeviceIcon = ({
    device,
    size = 32,
    color = COLORS.TEXT_SECONDARY,
    hoverColor,
    onClick,
}: Props) => {
    const majorVersion = device.features ? device.features.major_version : 2;
    return (
        <SvgWrapper
            hoverColor={hoverColor}
            width={`${size}`}
            height={`${size}`}
            viewBox="0 0 1024 1024"
            onClick={onClick}
        >
            <Path
                key={majorVersion}
                color={color}
                d={getDeviceIcon(majorVersion)}
            />
        </SvgWrapper>
    );
};

DeviceIcon.propTypes = {
    device: PropTypes.object,
    size: PropTypes.number,
    color: PropTypes.string,
    hoverColor: PropTypes.string,
    onClick: PropTypes.func,
};

export default DeviceIcon;