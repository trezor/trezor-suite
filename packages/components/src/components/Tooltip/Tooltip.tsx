import styled, { ThemeProvider } from 'styled-components';
import { ReactNode, MutableRefObject } from 'react';
import { transparentize } from 'polished';
import { ZIndexValues, spacings, zIndices } from '@trezor/theme';
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

const Content = styled.div<{ $dashed: boolean; $cursor: Cursor }>`
    cursor: ${({ $cursor }) => $cursor};

    > * {
        border-bottom: ${({ $dashed, theme }) =>
            $dashed && `1.5px dashed ${transparentize(0.66, theme.TYPE_LIGHT_GREY)}`};
        cursor: ${({ $cursor }) => $cursor};
    }
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
    appendTo?: HTMLElement | null | MutableRefObject<HTMLElement | null>;
    zIndex?: ZIndexValues;
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
    isOpen,
    hasArrow,
    appendTo,
    shift,
    zIndex = zIndices.tooltip,
}: TooltipProps) => {
    if (!content || !children) {
        return <>{children}</>;
    }

    const delayConfiguration = { open: delayShow, close: delayHide };

    return (
        <Wrapper $isFullWidth={isFullWidth} className={className}>
            <TooltipFloatingUi
                placement={placement}
                isOpen={isOpen}
                offset={offset}
                shift={shift}
                delay={delayConfiguration}
            >
                <TooltipTrigger>
                    <Content $dashed={dashed} $cursor={disabled ? 'default' : cursor}>
                        {children}
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
