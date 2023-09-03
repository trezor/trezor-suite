import React from 'react';
import { ReactSVG } from 'react-svg';

import styled, { useTheme } from 'styled-components';

import { icons } from '../icons';
import { IconProps, iconSizes } from '../config';

const SVG = styled(ReactSVG)`
    display: flex;
    align-items: center;
    justify-content: center;

    div {
        display: flex;
        align-items: center;
        justify-content: center;
    }
`;

type WebIconProps = IconProps & {
    className?: string;
};

export const Icon = ({ name, size = 'large', color = 'iconDefault', className }: WebIconProps) => {
    const theme = useTheme();

    const iconSize = typeof size === 'string' ? iconSizes[size] : size;

    return (
        <SVG
            src={icons[name]}
            beforeInjection={svg => {
                svg.querySelectorAll('path')?.forEach(path =>
                    path.setAttribute('stroke', theme[color]),
                );
                svg.setAttribute('width', `${iconSize}px`);
                svg.setAttribute('height', `${iconSize}px`);
            }}
            className={className}
        />
    );
};
