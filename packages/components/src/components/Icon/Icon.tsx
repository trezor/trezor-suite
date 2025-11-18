import { MouseEvent } from 'react';
import { ReactSVG } from 'react-svg';

import styled, { css } from 'styled-components';

// TODO: suite-common imports in non-suite packages should not be allowed
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { IconName, icons } from '@suite-common/icons/src/icons';
import { CSSColor } from '@trezor/theme';

import { IconSize, IconVariant } from './types';
import { mapVariantToColor } from './utils';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';

export const allowedIconFrameProps = [
    'margin',
    'pointerEvents',
    'cursor',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedIconFrameProps)[number]>;

type ContainerProps = TransientProps<Pick<IconProps, 'color' | 'variant'>> & {
    $size: IconSize;
    $isDisabled: boolean;
};

const Container = styled.div<ContainerProps & TransientProps<AllowedFrameProps>>`
    ${({ $size }) => css`
        width: ${$size}px;
        height: ${$size}px;
    `}

    path {
        fill: ${({ $variant, $color, $isDisabled, theme }) =>
            $color ?? mapVariantToColor(theme, $isDisabled, $variant)};
        transition: fill 0.14s;
    }

    flex-shrink: 0;

    ${withFrameProps}
`;

const SVG = styled(ReactSVG)`
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;

    div {
        display: flex;
        justify-content: center;
    }

    path {
        transition:
            stroke 0.15s,
            fill 0.15s;
    }
` as typeof ReactSVG;

export type ExclusiveColorOrVariant =
    | { variant?: IconVariant; color?: undefined }
    | {
          variant?: undefined;
          color?: CSSColor;
      };

export type IconProps = AllowedFrameProps & {
    name: IconName;
    size?: IconSize;
    isDisabled?: boolean;
    onClick?: (e: any) => void;
    className?: string;
    'data-testid'?: string;
} & ExclusiveColorOrVariant;

export const Icon = ({
    name,
    size = 24,
    color,
    variant,
    isDisabled = false,
    onClick,
    className,
    'data-testid': dataTest,
    cursor,
    ...rest
}: IconProps) => {
    const handleOnKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            onClick?.(e);
        }
    };

    const handleInjection = (svg: SVGSVGElement) => {
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
    };

    const handleClick = (e: MouseEvent<any>) => {
        onClick?.(e);

        // We need to stop default/propagation in case the icon is rendered in popup/modal so it won't close it.
        e.preventDefault();
        e.stopPropagation();
    };

    const frameProps = pickAndPrepareFrameProps(rest, allowedIconFrameProps);

    return (
        <Container
            $color={color}
            $size={size}
            $variant={variant}
            $isDisabled={isDisabled}
            data-testid={dataTest}
            onClick={onClick && !isDisabled ? handleClick : undefined}
            className={className}
            {...frameProps}
            $cursor={cursor ?? (onClick && !isDisabled ? 'pointer' : undefined)}
        >
            <SVG
                tabIndex={onClick && !isDisabled ? 0 : undefined}
                onKeyDown={handleOnKeyDown}
                src={icons[name as IconName]}
                beforeInjection={handleInjection}
            />
        </Container>
    );
};

export type { IconName, IconSize, IconVariant };
