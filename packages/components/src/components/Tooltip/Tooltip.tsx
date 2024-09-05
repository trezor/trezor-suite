import styled, { ThemeProvider } from 'styled-components';
import { ReactNode, MutableRefObject } from 'react';
import { transparentize } from 'polished';
import { ZIndexValues, spacingsPx, spacings, zIndices } from '@trezor/theme';

import { Icon } from '../Icon/Icon';
import { TooltipContent, TooltipFloatingUi, TooltipTrigger } from './TooltipFloatingUi';
import { Placement, ShiftOptions } from '@floating-ui/react';
import { TooltipBox, TooltipBoxProps } from './TooltipBox';
import { TooltipArrow } from './TooltipArrow';
import { TOOLTIP_DELAY_SHORT, TooltipDelay } from './TooltipDelay';
import { intermediaryTheme } from '../..';

export type Cursor = 'inherit' | 'pointer' | 'help' | 'default' | 'not-allowed';

const Wrapper = styled.div<{ $isFullWidth: boolean }>`
    width: ${({ $isFullWidth }) => ($isFullWidth ? '100%' : 'auto')};
`;

const Content = styled.div<{ $dashed: boolean; $isInline: boolean; $cursor: Cursor }>`
    display: ${({ $isInline }) => ($isInline ? 'inline-flex' : 'flex')};
    align-items: center;
    justify-content: flex-start;
    gap: ${spacingsPx.xxs};
    cursor: ${({ $cursor }) => $cursor};
    border-bottom: ${({ $dashed, theme }) =>
        $dashed && `1.5px dotted ${transparentize(0.66, theme.textSubdued)}`};
`;

export type TooltipInteraction = 'none' | 'hover';

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
    children: ReactNode;
    className?: string;
    disabled?: boolean;
    dashed?: boolean;
    offset?: number;
    shift?: ShiftOptions;
    cursor?: Cursor;
    isFullWidth?: boolean;
    placement?: Placement;
    hasArrow?: boolean;
    hasIcon?: boolean;
    appendTo?: HTMLElement | null | MutableRefObject<HTMLElement | null>;
    zIndex?: ZIndexValues;
    isInline?: boolean;
};

export type TooltipProps = (ManagedModeProps | UnmanagedModeProps) &
    TooltipUiProps &
    TooltipBoxProps;

export const Tooltip = ({
    placement = 'top',
    children,
    isLarge = false,
    dashed = false,
    delayShow = TOOLTIP_DELAY_SHORT,
    delayHide = TOOLTIP_DELAY_SHORT,
    maxWidth = 400,
    offset = spacings.sm,
    cursor = 'help',
    content,
    addon,
    title,
    headerIcon,
    disabled,
    className,
    isFullWidth = false,
    isInline = false,
    isOpen,
    hasArrow,
    hasIcon = false,
    appendTo,
    shift,
    zIndex = zIndices.tooltip,
}: TooltipProps) => {
    if (!content || !children) {
        return <>{children}</>;
    }

    const delayConfiguration = { open: delayShow, close: delayHide };
    const elType = isInline ? 'span' : 'div';

    return (
        <Wrapper $isFullWidth={isFullWidth} className={className} as={elType}>
            <TooltipFloatingUi
                placement={placement}
                isOpen={isOpen}
                offset={offset}
                shift={shift}
                delay={delayConfiguration}
            >
                <TooltipTrigger>
                    <Content
                        $dashed={dashed}
                        $isInline={isInline}
                        $cursor={disabled ? 'default' : cursor}
                        as={elType}
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
