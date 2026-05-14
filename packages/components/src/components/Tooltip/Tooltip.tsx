import { type MutableRefObject, type ReactNode } from 'react';

import { type Placement, type ShiftOptions } from '@floating-ui/react';
import styled, { ThemeProvider } from 'styled-components';

import { type ZIndexValues, spacingsPx, zIndices } from '@trezor/theme';

import { TooltipArrow } from './TooltipArrow';
import { TooltipBox, type TooltipBoxProps } from './TooltipBox';
import { TOOLTIP_DELAY_SHORT, type TooltipDelay } from './TooltipDelay';
import { TooltipContent, TooltipFloatingUi, TooltipTrigger } from './TooltipFloatingUi';
import { intermediaryTheme } from '../../config/colors';
import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { type TransientProps } from '../../utils/transientProps';
import { Icon } from '../Icon/Icon';

export type TooltipInteraction = 'none' | 'hover';

export const allowedTooltipFrameProps = [
    'cursor',
    'display',
    'margin',
    'width',
    'maxWidth',
    'minWidth',
    'flex',
] as const satisfies FramePropsKeys[];
export type AllowedFrameProps = Pick<FrameProps, (typeof allowedTooltipFrameProps)[number]>;

const Content = styled.div<TransientProps<AllowedFrameProps>>`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
    text-decoration: inherit;

    ${withFrameProps}
`;

type ManagedModeProps = {
    isOpen?: boolean;

    delayShow?: undefined;
    delayHide?: undefined;
};

type UnmanagedModeProps = {
    isOpen?: undefined;

    delayShow?: TooltipDelay;
    delayHide?: TooltipDelay;
};

type TooltipUiProps = {
    isActive?: boolean;
    children: ReactNode;
    offset?: number;
    shift?: ShiftOptions;
    placement?: Placement;
    hasArrow?: boolean;
    hasIcon?: boolean;
    appendTo?: HTMLElement | null | MutableRefObject<HTMLElement | null>;
    zIndex?: ZIndexValues;
    disableFlip?: boolean;
    as?: 'div' | 'span';
} & AllowedFrameProps;

export type ManagedTooltipProps = ManagedModeProps & TooltipUiProps & TooltipBoxProps;
export type UnmanagedTooltipProps = UnmanagedModeProps & TooltipUiProps & TooltipBoxProps;

export type TooltipProps = ManagedTooltipProps | UnmanagedTooltipProps;

export const Tooltip = ({
    isActive = true,
    placement = 'top',
    children,
    delayShow = TOOLTIP_DELAY_SHORT,
    delayHide = TOOLTIP_DELAY_SHORT,
    tooltipMaxWidth = 400,
    offset = 12,
    content,
    addon,
    title,
    isOpen,
    hasArrow = true,
    hasIcon = false,
    appendTo,
    shift,
    zIndex = zIndices.tooltip,
    disableFlip = false,
    as = 'div',
    ...rest
}: TooltipProps) => {
    const frameProps = pickAndPrepareFrameProps(
        rest,
        allowedTooltipFrameProps,
    ) as TransientProps<AllowedFrameProps>;

    if (!content || !children) {
        return <>{children}</>;
    }

    const delayConfiguration = { open: delayShow, close: delayHide };

    return (
        <TooltipFloatingUi
            isActive={isActive}
            placement={placement}
            isOpen={isOpen}
            offset={offset}
            shift={shift}
            delay={delayConfiguration}
            disableFlip={disableFlip}
        >
            <TooltipTrigger>
                <Content as={as} {...frameProps}>
                    {children}
                    {hasIcon && isActive && <Icon name="question" size={16} />}
                </Content>
            </TooltipTrigger>

            <TooltipContent
                data-testid="@tooltip"
                style={{ zIndex }}
                arrowRender={hasArrow ? TooltipArrow : undefined}
                appendTo={appendTo}
                onClick={e => e.stopPropagation()}
            >
                <ThemeProvider theme={{ variant: 'dark', ...intermediaryTheme.dark }}>
                    <TooltipBox
                        content={content}
                        addon={addon}
                        tooltipMaxWidth={tooltipMaxWidth}
                        title={title}
                    />
                </ThemeProvider>
            </TooltipContent>
        </TooltipFloatingUi>
    );
};
