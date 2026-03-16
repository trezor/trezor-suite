import { useCallback, useEffect, useReducer, useRef } from 'react';

import styled, { css } from 'styled-components';

import { type ZIndexValues, zIndices } from '@trezor/theme';
import { createCooldown } from '@trezor/utils';

import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { type TransientProps } from '../../utils/transientProps';

export const allowedResizableBoxFrameProps = ['margin', 'flex'] as const satisfies FramePropsKeys[];
type AllowedResizableBoxFrameProps = Pick<
    FrameProps,
    (typeof allowedResizableBoxFrameProps)[number]
>;

type Direction = 'top' | 'left' | 'right' | 'bottom';
type Directions = Array<Direction>;

type DisabledInterval = [number, number];

export type ResizableBoxProps = AllowedResizableBoxFrameProps & {
    collapse?: boolean;
    children: React.ReactNode;
    directions: Directions;
    isLocked?: boolean;
    width?: number;
    minWidth?: number;
    forcedWidth?: number;
    maxWidth?: number;
    height?: number;
    minHeight?: number;
    maxHeight?: number;
    zIndex?: ZIndexValues;
    onWidthResizeEnd?: (width: number) => void;
    onHeightResizeEnd?: (height: number) => void;
    onWidthResizeMove?: (width: number) => void;
    onHeightResizeMove?: (height: number) => void;
    onResizeStart?: (direction: Direction) => void;
    onResizeStop?: (direction: Direction | null) => void;
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

type ResizePointerEvent = MouseEvent | TouchEvent;

const getPageCoords = (e: ResizePointerEvent) => {
    if (e instanceof MouseEvent) {
        return { x: e.pageX, y: e.pageY };
    }

    const touch = e.touches[0] || e.changedTouches[0];
    if (!touch) return null;

    return { x: touch.pageX, y: touch.pageY };
};

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
    collapse,
    children,
    directions,
    forcedWidth,
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
    onResizeStart,
    onResizeStop,
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
    const {
        x,
        y,
        width: widthState,
        height: heightState,
        isResizing,
        isHovering,
        direction,
    } = state;

    const effectiveWidth = typeof forcedWidth === 'number' ? forcedWidth : widthState;

    const resizeCooldown = createCooldown(150);

    useEffect(() => {
        if (resizableBoxRef.current) {
            const rect = resizableBoxRef.current.getBoundingClientRect();
            dispatch({ type: 'SET_POSITION', x: rect.x, y: rect.y });

            if (widthState === 0) {
                dispatch({ type: 'SET_WIDTH', width: rect.width });
            }
            if (heightState === 0) {
                dispatch({ type: 'SET_HEIGHT', height: rect.height });
            }
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleResize = useCallback(
        (e: ResizePointerEvent) => {
            if (!direction || !resizeCooldown()) return;

            const coords = getPageCoords(e);
            if (!coords) return;

            const { x: mouseX, y: mouseY } = coords;

            if (rafRef.current) cancelAnimationFrame(rafRef.current);

            rafRef.current = requestAnimationFrame(() => {
                const difX = mouseX - x - effectiveWidth;
                const difY = mouseY - y - heightState;

                let nextWidth = effectiveWidth;
                let nextHeight = heightState;

                if (direction === 'top') {
                    let result = ensureMinimalSize(-difY);
                    result = calculateDisabledInterval(result, disabledHeightInterval);
                    nextHeight =
                        difY < 0
                            ? getMaxResult(maxHeight, result)
                            : getMinResult(minHeight, result);
                    dispatch({ type: 'SET_HEIGHT', height: nextHeight });
                } else if (direction === 'bottom') {
                    let result = ensureMinimalSize(heightState + difY);
                    result = calculateDisabledInterval(result, disabledHeightInterval);
                    nextHeight =
                        difY > 0
                            ? getMaxResult(maxHeight, result)
                            : getMinResult(minHeight, result);
                    dispatch({ type: 'SET_HEIGHT', height: nextHeight });
                } else if (direction === 'left') {
                    let result = ensureMinimalSize(-difX);
                    result = calculateDisabledInterval(result, disabledWidthInterval);
                    nextWidth =
                        difX < 0 ? getMaxResult(maxWidth, result) : getMinResult(minWidth, result);
                    dispatch({ type: 'SET_WIDTH', width: nextWidth });
                } else if (direction === 'right') {
                    let result = ensureMinimalSize(effectiveWidth + difX);
                    result = calculateDisabledInterval(result, disabledWidthInterval);
                    nextWidth =
                        difX > 0 ? getMaxResult(maxWidth, result) : getMinResult(minWidth, result);
                    dispatch({ type: 'SET_WIDTH', width: nextWidth });
                }

                onWidthResizeMove?.(nextWidth);
                onHeightResizeMove?.(nextHeight);
            });
        },
        [
            direction,
            x,
            y,
            effectiveWidth,
            heightState,
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

        window.addEventListener('mousemove', handleResize as (e: MouseEvent) => void);
        window.addEventListener('touchmove', handleResize as (e: TouchEvent) => void);

        const currentDirection = direction;

        const handleMouseUp = () => {
            onResizeStop?.(currentDirection ?? null);
            dispatch({ type: 'STOP_RESIZE' });
            onWidthResizeEnd?.(widthState);
            onHeightResizeEnd?.(heightState);
        };

        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchend', handleMouseUp);
        window.addEventListener('touchcancel', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleResize as (e: MouseEvent) => void);
            window.removeEventListener('touchmove', handleResize as (e: TouchEvent) => void);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchend', handleMouseUp);
            window.removeEventListener('touchcancel', handleMouseUp);

            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [
        isResizing,
        handleResize,
        widthState,
        heightState,
        onWidthResizeEnd,
        onHeightResizeEnd,
        onResizeStop,
        direction,
    ]);

    const handleMouseDown = useCallback(
        (handlerDirection: Direction) => () => {
            onResizeStart?.(handlerDirection);
            dispatch({ type: 'START_RESIZE', direction: handlerDirection });
        },
        [onResizeStart],
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
        onTouchStart: handleMouseDown(handlerDirection),
        onMouseOver: handleMouseOver(handlerDirection),
        onMouseOut: handleMouseOut,
        $highlightDirection: highlightDirection,
        $zIndex: zIndex,
    });

    const showTop = directions.includes('top');
    const showBottom = directions.includes('bottom');
    const showLeft = directions.includes('left') && !isLocked;
    const showRight = directions.includes('right') && !isLocked;

    return (
        <Resizers
            $width={collapse ? minWidth : effectiveWidth}
            $minWidth={minWidth}
            $maxWidth={maxWidth}
            $height={showTop || showBottom ? heightState : undefined}
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
                    {showTop && <TopHandler {...getHandlerProps('top')} />}
                    {showLeft && <LeftHandler {...getHandlerProps('left')} />}
                    {showBottom && <BottomHandler {...getHandlerProps('bottom')} />}
                    {showRight && <RightHandler {...getHandlerProps('right')} />}
                </>
            )}
        </Resizers>
    );
};
