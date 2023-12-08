import { ReactSVG } from 'react-svg';

import styled, { css, useTheme } from 'styled-components';

import { CSSColor, Color, isCSSColor } from '@trezor/theme';

import { icons } from '../icons';
import { IconProps, getIconSize } from '../config';

const SVG = styled(ReactSVG)`
    display: flex;
    align-items: center;
    justify-content: center;

    div {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    path {
        transition:
            stroke 0.15s,
            fill 0.15s;
    }

    ${({ onClick }) =>
        onClick &&
        css`
            cursor: pointer;

            :focus-visible {
                svg {
                    transition: opacity 0.2s;
                    opacity: 0.5;
                }
            }
        `}
`;

type WebIconProps = Omit<IconProps, 'color'> & {
    color?: CSSColor | Color;
    onClick?: () => void;
    className?: string;
};

export const Icon = ({
    name,
    size = 'large',
    color = 'iconDefault',
    onClick,
    className,
}: WebIconProps) => {
    const theme = useTheme();

    const iconSize = getIconSize(size);

    const handleOnKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            onClick?.();
        }
    };

    const handleInjection = (svg: SVGSVGElement) => {
        const strokeColor = isCSSColor(color) ? color : theme[color];

        svg.querySelectorAll('path')?.forEach(path => {
            if (path.hasAttribute('fill')) {
                path.setAttribute('fill', strokeColor);
            }
            path.setAttribute('stroke', strokeColor);
        });
        svg.setAttribute('width', `${iconSize}px`);
        svg.setAttribute('height', `${iconSize}px`);
    };

    return (
        <SVG
            onClick={onClick}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={handleOnKeyDown}
            src={icons[name]}
            beforeInjection={handleInjection}
            className={className}
        />
    );
};
