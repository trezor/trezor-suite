import { type ComponentType, type KeyboardEvent, type MouseEvent, type SVGProps } from 'react';

import styled, { css } from 'styled-components';

import { type Color } from '@trezor/theme';

import {
    type IconIntent,
    type IconPriority,
    type IconSize,
    iconIntents,
    iconPriorities,
} from './types';
import { mapIntentToCSS } from './utils';
import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { type TransientProps } from '../../utils/transientProps';

export { iconIntents, iconPriorities };
export type { IconIntent, IconPriority, IconSize };
export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export const allowedIconFrameProps = [
    'margin',
    'pointerEvents',
    'cursor',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedIconFrameProps)[number]>;

type ExclusiveColorOrIntent =
    | {
          intent?: IconIntent;
          priority?: IconPriority;
          isDisabled?: boolean;
          color?: undefined;
      }
    | {
          intent?: undefined;
          priority?: undefined;
          isDisabled?: undefined;
          color?: Color;
      };

type ContainerProps = {
    $size: IconSize;
    $intent?: IconIntent;
    $priority?: IconPriority;
    $isDisabled: boolean;
    $color?: Color;
} & TransientProps<AllowedFrameProps>;

const Container = styled.div<ContainerProps>`
    ${({ $size }) => css`
        width: ${$size}px;
        height: ${$size}px;
    `}

    path {
        fill: ${({ $intent, $priority = 'primary', $isDisabled, $color, theme }) => {
            if ($color !== undefined) {
                return theme[$color];
            }

            if ($intent === undefined && !$isDisabled) {
                return 'currentColor';
            }

            return mapIntentToCSS($intent ?? 'neutral', $priority, $isDisabled, theme);
        }};
        transition: fill 0.14s;
    }

    flex-shrink: 0;

    ${withFrameProps}
`;

export type IconBaseProps = AllowedFrameProps & {
    size?: IconSize;
    onClick?: (e: MouseEvent<HTMLDivElement> | KeyboardEvent<Element>) => void;
    'data-testid'?: string;
};

export type IconSharedProps = IconBaseProps & ExclusiveColorOrIntent;

export type IconProps = IconSharedProps & {
    as: IconComponent;
};

export const Icon = ({
    as: IconComponent,
    size = 24,
    intent,
    priority = 'primary',
    isDisabled = false,
    color,
    onClick,
    'data-testid': dataTest,
    cursor,
    ...rest
}: IconProps) => {
    const handleOnKeyDown = (e: KeyboardEvent<Element>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            onClick?.(e);
        }
    };

    const handleClick = (e: MouseEvent<HTMLDivElement>) => {
        onClick?.(e);

        // We need to stop default/propagation in case the icon is rendered in popup/modal so it won't close it.
        e.preventDefault();
        e.stopPropagation();
    };

    const frameProps = pickAndPrepareFrameProps(rest, allowedIconFrameProps);

    return (
        <Container
            $size={size}
            $intent={intent}
            $priority={priority}
            $isDisabled={isDisabled}
            $color={color}
            data-testid={dataTest}
            onClick={onClick && !isDisabled ? handleClick : undefined}
            {...frameProps}
            $cursor={cursor ?? (onClick && !isDisabled ? 'pointer' : undefined)}
        >
            <IconComponent
                width="100%"
                height="100%"
                tabIndex={onClick && !isDisabled ? 0 : undefined}
                onKeyDown={handleOnKeyDown}
            />
        </Container>
    );
};
