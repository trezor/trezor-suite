import { useCallback, useEffect, useReducer, useRef } from 'react';

import styled, { css } from 'styled-components';

import { ZIndexValues, zIndices } from '@trezor/theme';
import { createCooldown } from '@trezor/utils';

import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';

export const allowedResizableBoxFrameProps = ['margin', 'flex'] as const satisfies FramePropsKeys[];
type AllowedResizableBoxFrameProps = Pick<
    FrameProps,
    (typeof allowedResizableBoxFrameProps)[number]
>;

type Direction = 'top' | 'left' | 'right' | 'bottom';
type Directions = Array<Direction>;

type DisabledInterval = [number, number];

export type ResizableBoxProps = AllowedResizableBoxFrameProps & {
    children: React.ReactNode;
    directions: Directions;
    isLocked?: boolean;
    width?: number;
    minWidth?: number;
    maxWidth?: number;
    height?: number;
    minHeight?: number;
    maxHeight?: number;
    zIndex?: ZIndexValues;
    onWidthResizeEnd?: (width: number) => void;
    onHeightResizeEnd?: (height: number) => void;
    onWidthResizeMove?: (width: number) => void;
    onHeightResizeMove?: (height: number) => void;
    disabledWidthInterval?: DisabledInterval;
    disabledHeightInterval?: DisabledInterval;
};

type ResizerHandlersProps = {
    $highlightDirection: Direction | null;
    $zIndex?: ZIndexValues;
};

type ResizersProps = TransientProps<AllowedResizableBoxFrameProps> &
    ResizerHandlersProps & {
        $width?: number;
        $minWidth?: number;
        $maxWidth?: number;
        $height?: number;
        $minHeight?: number;
        $maxHeight?: number;
        $isResizing?: boolean;
    };

const MINIMAL_BOX_SIZE = 1;
const REACTIVE_AREA_WIDTH = 16;
const BORDER_WIDTH = 4;

const Resizers = styled.div<ResizersProps>`
    width: ${({ $width }) => ($width ? `${$width}px` : 'auto')};
    min-width: ${({ $minWidth }) => ($minWidth ? `${$minWidth}px` : 'auto')};
    max-width: ${({ $maxWidth }) => ($maxWidth ? `${$maxWidth}px` : '100%')};
    height: ${({ $height }) => ($height ? `${$height}px` : 'auto')};
    min-height: ${({ $minHeight }) => ($minHeight ? `${$minHeight}px` : 'auto')};
    max-height: ${({ $maxHeight }) => ($maxHeight ? `${$maxHeight}px` : '100%')};
    box-sizing: border-box;
    position: relative;
    ${({ $isResizing }) =>
        $isResizing &&
        css`
            user-select: none;
            cursor: ${$isResizing ? 'ns-resize' : 'auto'};
        `}

    ${withFrameProps}
`;

const handlersCommonStyles = css`
    position: absolute;

    &::after {
        position: absolute;
        content: '';
        display: block;
        pointer-events: none;
    }
`;

const TopHandler = styled.div<ResizerHandlersProps>(
    ({ $highlightDirection, $zIndex, theme }) => `
        ${handlersCommonStyles};
        width: 100%;
        height: ${REACTIVE_AREA_WIDTH}px;
        cursor: ns-resize;
        top: ${`-${REACTIVE_AREA_WIDTH / 2}px`};
        z-index: ${$zIndex};

        &::after {
            top: calc(50% - ${BORDER_WIDTH / 2}px);
            width: 100%;
            ${
                $highlightDirection === 'top' &&
                `border-${$highlightDirection}: ${BORDER_WIDTH}px solid ${theme.borderFocus};`
            };
        }
    `,
);

const BottomHandler = styled.div<ResizerHandlersProps>(
    ({ $highlightDirection, $zIndex, theme }) => `
        ${handlersCommonStyles};
        width: 100%;
        height: ${REACTIVE_AREA_WIDTH}px;
        cursor: ns-resize;
        bottom: ${`-${REACTIVE_AREA_WIDTH / 2}px`};
        z-index: ${$zIndex};

        &::after {
            bottom: calc(50% - ${BORDER_WIDTH / 2}px);
            width: 100%;
            ${
                $highlightDirection === 'bottom' &&
                `border-${$highlightDirection}: ${BORDER_WIDTH}px solid ${theme.borderFocus};`
            };
        }
    `,
);

const LeftHandler = styled.div<ResizerHandlersProps>(
    ({ $highlightDirection, $zIndex, theme }) => `
        ${handlersCommonStyles};
        width: ${REACTIVE_AREA_WIDTH}px;
        height: 100%;
        cursor: ew-resize;
        bottom: 0;
        left: ${`-${REACTIVE_AREA_WIDTH / 2}px`};
        z-index: ${$zIndex};

        &::after {
            left: calc(50% - ${BORDER_WIDTH / 2}px);
            height: 100%;
            ${
                $highlightDirection === 'left' &&
                `border-${$highlightDirection}: ${BORDER_WIDTH}px solid ${theme.borderFocus};`
            };
        }
    `,
);

const RightHandler = styled.div<ResizerHandlersProps>(
    ({ $highlightDirection, $zIndex, theme }) => `
        ${handlersCommonStyles};
        width: ${REACTIVE_AREA_WIDTH}px;
        height: 100%;
        cursor: ew-resize;
        bottom: 0;
        right: ${`-${REACTIVE_AREA_WIDTH / 2}px`};
        z-index: ${$zIndex};

        &::after {
            right: calc(50% - ${BORDER_WIDTH / 2}px);
            height: 100%;
            ${
                $highlightDirection === 'right' &&
                `border-${$highlightDirection}: ${BORDER_WIDTH}px solid ${theme.borderFocus};`
            };
        }
    `,
);

const Child = styled(Resizers)(
    ({ $isResizing }) => `
    position: relative;
    width: 100%;
    height: 100%;
    overflow: auto;
    ${$isResizing && `overflow: hidden;`};
`,
);

const ensureMinimalSize = (size: number): number =>
    size < MINIMAL_BOX_SIZE ? MINIMAL_BOX_SIZE : size;

const getMinResult = (min: number, result: number) => (result > min ? result : min);

const getMaxResult = (max: number | undefined, result: number) =>
    max === undefined || result < max ? result : max;

const isInDisabledInterval = (value: number, interval?: DisabledInterval) =>
    interval && value > interval[0] && value < interval[1];

const calculateDisabledInterval = (result: number, disabledInterval?: DisabledInterval) => {
    if (disabledInterval && isInDisabledInterval(result, disabledInterval)) {
        return result < (disabledInterval[0] + disabledInterval[1]) / 2
            ? disabledInterval[0]
            : disabledInterval[1];
    }

    return result;
};

type ResizeState = {
    x: number;
    y: number;
    width: number;
    height: number;
    isResizing: boolean;
    isHovering: boolean;
    direction: Direction | null;
};

type ResizeAction =
    | { type: 'SET_POSITION'; x: number; y: number }
    | { type: 'SET_WIDTH'; width: number }
    | { type: 'SET_HEIGHT'; height: number }
    | { type: 'START_RESIZE'; direction: Direction }
    | { type: 'STOP_RESIZE' }
    | { type: 'MOUSE_OVER'; direction: Direction }
    | { type: 'MOUSE_OUT' };

const resizeReducer = (state: ResizeState, action: ResizeAction): ResizeState => {
    switch (action.type) {
        case 'SET_POSITION':
            return { ...state, x: action.x, y: action.y };
        case 'SET_WIDTH':
            return { ...state, width: action.width };
        case 'SET_HEIGHT':
            return { ...state, height: action.height };
        case 'START_RESIZE':
            return {
                ...state,
                isResizing: true,
                isHovering: false,
                direction: action.direction,
            };
        case 'STOP_RESIZE':
            return { ...state, isResizing: false };
        case 'MOUSE_OVER':
            return {
                ...state,
                isHovering: true,
                direction: action.direction,
            };
        case 'MOUSE_OUT':
            return {
                ...state,
                isHovering: false,
                direction: state.isResizing ? state.direction : null,
            };
        default:
            return state;
    }
};

export const ResizableBox = ({
    children,
    directions,
    isLocked = false,
    width,
    minWidth = 0,
    maxWidth,
    height,
    minHeight = 0,
    maxHeight,
    zIndex = zIndices.draggableComponent,
    onWidthResizeEnd,
    onHeightResizeEnd,
    onWidthResizeMove,
    onHeightResizeMove,
    disabledWidthInterval,
    disabledHeightInterval,
    ...rest
}: ResizableBoxProps) => {
    const resizableBoxRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);
    const frameProps = pickAndPrepareFrameProps(rest, allowedResizableBoxFrameProps);

    const initialState: ResizeState = {
        x: 0,
        y: 0,
        width: width || minWidth,
        height: height || minHeight,
        isResizing: false,
        isHovering: false,
        direction: null,
    };

    const [state, dispatch] = useReducer(resizeReducer, initialState);
    const { x, y, width: newWidth, height: newHeight, isResizing, isHovering, direction } = state;

    const resizeCooldown = createCooldown(150);

    useEffect(() => {
        if (resizableBoxRef.current) {
            const rect = resizableBoxRef.current.getBoundingClientRect();
            dispatch({ type: 'SET_POSITION', x: rect.x, y: rect.y });

            if (newWidth === 0) {
                dispatch({ type: 'SET_WIDTH', width: rect.width });
            }
            if (newHeight === 0) {
                dispatch({ type: 'SET_HEIGHT', height: rect.height });
            }
        }
    }, [newWidth, newHeight]);

    const handleResize = useCallback(
        (e: MouseEvent) => {
            if (!direction || !resizeCooldown()) return;

            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }

            rafRef.current = requestAnimationFrame(() => {
                const mouseX = e.pageX;
                const mouseY = e.pageY;

                const difX = mouseX - x - newWidth;
                const difY = mouseY - y - newHeight;

                let result = 0;

                if (direction === 'top') {
                    result = ensureMinimalSize(-difY);
                    result = calculateDisabledInterval(result, disabledHeightInterval);

                    if (difY < 0) {
                        dispatch({ type: 'SET_HEIGHT', height: getMaxResult(maxHeight, result) });
                    } else if (difY > 0) {
                        dispatch({ type: 'SET_HEIGHT', height: getMinResult(minHeight, result) });
                    }
                } else if (direction === 'bottom') {
                    result = ensureMinimalSize(newHeight + difY);
                    result = calculateDisabledInterval(result, disabledHeightInterval);

                    if (difY > 0) {
                        dispatch({ type: 'SET_HEIGHT', height: getMaxResult(maxHeight, result) });
                    } else if (difY < 0) {
                        dispatch({ type: 'SET_HEIGHT', height: getMinResult(minHeight, result) });
                    }
                } else if (direction === 'left') {
                    result = ensureMinimalSize(-difX);
                    result = calculateDisabledInterval(result, disabledWidthInterval);

                    if (difX < 0) {
                        dispatch({ type: 'SET_WIDTH', width: getMaxResult(maxWidth, result) });
                    } else if (difX > 0) {
                        dispatch({ type: 'SET_WIDTH', width: getMinResult(minWidth, result) });
                    }
                } else if (direction === 'right') {
                    result = ensureMinimalSize(newWidth + difX);
                    result = calculateDisabledInterval(result, disabledWidthInterval);

                    if (difX > 0) {
                        dispatch({ type: 'SET_WIDTH', width: getMaxResult(maxWidth, result) });
                    } else if (difX < 0) {
                        dispatch({ type: 'SET_WIDTH', width: getMinResult(minWidth, result) });
                    }
                }

                onWidthResizeMove?.(newWidth);
                onHeightResizeMove?.(newHeight);
            });
        },
        [
            direction,
            x,
            y,
            newWidth,
            newHeight,
            minWidth,
            maxWidth,
            minHeight,
            maxHeight,
            disabledWidthInterval,
            disabledHeightInterval,
            onWidthResizeMove,
            onHeightResizeMove,
            resizeCooldown,
        ],
    );

    useEffect(() => {
        if (!isResizing) return;

        window.addEventListener('mousemove', handleResize);

        const handleMouseUp = () => {
            dispatch({ type: 'STOP_RESIZE' });
            onWidthResizeEnd?.(newWidth);
            onHeightResizeEnd?.(newHeight);
        };

        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleResize);
            window.removeEventListener('mouseup', handleMouseUp);

            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [isResizing, handleResize, newWidth, newHeight, onWidthResizeEnd, onHeightResizeEnd]);

    const handleMouseDown = useCallback(
        (handlerDirection: Direction) => () => {
            dispatch({ type: 'START_RESIZE', direction: handlerDirection });
        },
        [],
    );

    const handleMouseOver = useCallback(
        (handlerDirection: Direction) => () => {
            if (!isResizing) {
                dispatch({ type: 'MOUSE_OVER', direction: handlerDirection });
            }
        },
        [isResizing],
    );

    const handleMouseOut = useCallback(() => {
        dispatch({ type: 'MOUSE_OUT' });
    }, []);

    const highlightDirection = isHovering || isResizing ? direction : null;

    const getHandlerProps = (handlerDirection: Direction) => ({
        onMouseDown: handleMouseDown(handlerDirection),
        onMouseOver: handleMouseOver(handlerDirection),
        onMouseOut: handleMouseOut,
        $highlightDirection: highlightDirection,
        $zIndex: zIndex,
    });

    return (
        <Resizers
            $width={newWidth}
            $minWidth={minWidth}
            $maxWidth={maxWidth}
            $height={
                directions.includes('top') || directions.includes('bottom') ? newHeight : undefined
            }
            $minHeight={minHeight}
            $maxHeight={maxHeight}
            ref={resizableBoxRef}
            $highlightDirection={highlightDirection}
            $isResizing={isResizing}
            $zIndex={zIndex}
            {...frameProps}
        >
            <Child $isResizing={isResizing} $highlightDirection={highlightDirection}>
                {children}
            </Child>
            {!isLocked && (
                <>
                    {directions.includes('top') && <TopHandler {...getHandlerProps('top')} />}
                    {directions.includes('left') && <LeftHandler {...getHandlerProps('left')} />}
                    {directions.includes('bottom') && (
                        <BottomHandler {...getHandlerProps('bottom')} />
                    )}
                    {directions.includes('right') && <RightHandler {...getHandlerProps('right')} />}
                </>
            )}
        </Resizers>
    );
};
