import { type MouseEvent, useEffect, useState } from 'react';
import { ReactSVG } from 'react-svg';

import styled, { css } from 'styled-components';

// TODO: suite-common imports in non-suite packages should not be allowed
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { type IconName } from '@suite-common/icons/src/icons';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { getCachedIcon, loadIcon } from '@suite-common/icons/src/iconsLazy';
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

export type IconProps = AllowedFrameProps & {
    name: IconName;
    size?: IconSize;
    onClick?: (e: any) => void;
    className?: string;
    'data-testid'?: string;
} & ExclusiveColorOrIntent;

export const Icon = ({
    name,
    size = 24,
    intent,
    priority = 'primary',
    isDisabled = false,
    color,
    onClick,
    className,
    'data-testid': dataTest,
    cursor,
    ...rest
}: IconProps) => {
    const [src, setSrc] = useState(() => getCachedIcon(name) ?? '');

    useEffect(() => {
        let cancelled = false;
        loadIcon(name)
            .then(url => {
                if (!cancelled) setSrc(url);
            })
            .catch(() => undefined);

        return () => {
            cancelled = true;
        };
    }, [name]);

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
            $size={size}
            $intent={intent}
            $priority={priority}
            $isDisabled={isDisabled}
            $color={color}
            data-testid={dataTest}
            onClick={onClick && !isDisabled ? handleClick : undefined}
            className={className}
            {...frameProps}
            $cursor={cursor ?? (onClick && !isDisabled ? 'pointer' : undefined)}
        >
            {src && (
                <SVG
                    tabIndex={onClick && !isDisabled ? 0 : undefined}
                    onKeyDown={handleOnKeyDown}
                    src={src}
                    beforeInjection={handleInjection}
                />
            )}
        </Container>
    );
};

export type { IconName };
