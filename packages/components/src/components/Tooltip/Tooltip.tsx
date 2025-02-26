import { MutableRefObject, ReactNode } from 'react';

import { Placement, ShiftOptions } from '@floating-ui/react';
import { transparentize } from 'polished';
import styled, { ThemeProvider } from 'styled-components';

import { ZIndexValues, spacings, spacingsPx, zIndices } from '@trezor/theme';

import { TooltipArrow } from './TooltipArrow';
import { TooltipBox, TooltipBoxProps } from './TooltipBox';
import { TOOLTIP_DELAY_SHORT, TooltipDelay } from './TooltipDelay';
import { TooltipContent, TooltipFloatingUi, TooltipTrigger } from './TooltipFloatingUi';
import { intermediaryTheme } from '../../config/colors';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';
import { Icon } from '../Icon/Icon';

export type TooltipInteraction = 'none' | 'hover';

export const allowedTooltipFrameProps = ['cursor'] as const satisfies FramePropsKeys[];
export type AllowedFrameProps = Pick<FrameProps, (typeof allowedTooltipFrameProps)[number]>;

const Wrapper = styled.div<{ $isFullWidth: boolean }>`
    width: ${({ $isFullWidth }) => ($isFullWidth ? '100%' : 'auto')};
`;

const Content = styled.div<
    { $dashed: boolean; $isInline: boolean } & TransientProps<AllowedFrameProps>
>`
    display: ${({ $isInline }) => ($isInline ? 'inline-flex' : 'flex')};
    align-items: center;
    justify-content: flex-start;
    gap: ${spacingsPx.xxs};
    cursor: ${({ $cursor }) => $cursor};
    border-bottom: ${({ $dashed, theme }) =>
        $dashed && `1.5px dotted ${transparentize(0.66, theme.textSubdued)}`};

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
    className?: string;
    dashed?: boolean;
    offset?: number;
    shift?: ShiftOptions;
    isFullWidth?: boolean;
    placement?: Placement;
    hasArrow?: boolean;
    hasIcon?: boolean;
    appendTo?: HTMLElement | null | MutableRefObject<HTMLElement | null>;
    zIndex?: ZIndexValues;
    isInline?: boolean;
    disableFlip?: boolean;
} & AllowedFrameProps;

export type ManagedTooltipProps = ManagedModeProps & TooltipUiProps & TooltipBoxProps;
export type UnmanagedTooltipProps = UnmanagedModeProps & TooltipUiProps & TooltipBoxProps;

export type TooltipProps = ManagedTooltipProps | UnmanagedTooltipProps;

export const Tooltip = ({
    isActive = true,
    placement = 'top',
    children,
    isLarge = false,
    dashed = false,
    delayShow = TOOLTIP_DELAY_SHORT,
    delayHide = TOOLTIP_DELAY_SHORT,
    maxWidth = 400,
    offset = spacings.sm,
    content,
    addon,
    title,
    headerIcon,
    className,
    isFullWidth = false,
    isInline = false,
    isOpen,
    hasArrow,
    hasIcon = false,
    appendTo,
    shift,
    zIndex = zIndices.tooltip,
    disableFlip = false,
    ...rest
}: TooltipProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedTooltipFrameProps);

    if (!content || !children) {
        return <>{children}</>;
    }

    const delayConfiguration = { open: delayShow, close: delayHide };
    const elType = isInline ? 'span' : 'div';

    return (
        <Wrapper $isFullWidth={isFullWidth} className={className} as={elType}>
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
                    <Content
                        $dashed={dashed}
                        $isInline={isInline}
                        as={elType}
                        {...frameProps}
                        $cursor={frameProps.$cursor ?? 'help'}
                    >
                        {children}
                        {hasIcon && <Icon name="question" size="medium" />}
                    </Content>
                </TooltipTrigger>

                <TooltipContent
                    data-testid="@tooltip"
                    style={{ zIndex }}
                    arrowRender={hasArrow ? TooltipArrow : undefined}
                    appendTo={appendTo}
                >
                    <ThemeProvider theme={intermediaryTheme.dark}>
                        <TooltipBox
                            content={content}
                            addon={addon}
                            headerIcon={headerIcon}
                            isLarge={isLarge}
                            maxWidth={maxWidth}
                            title={title}
                        />
                    </ThemeProvider>
                </TooltipContent>
            </TooltipFloatingUi>
        </Wrapper>
    );
};
