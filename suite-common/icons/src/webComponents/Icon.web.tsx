import { ReactSVG } from 'react-svg';

import styled, { css, useTheme } from 'styled-components';

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

type WebIconProps = IconProps & {
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
        svg.querySelectorAll('path')?.forEach(path => path.setAttribute('stroke', theme[color]));
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
