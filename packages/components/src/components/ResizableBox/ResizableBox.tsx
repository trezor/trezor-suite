import styled, { css } from 'styled-components';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createCooldown } from '@trezor/utils';
import { ZIndexValues, zIndices } from '@trezor/theme';

type Direction = 'top' | 'left' | 'right' | 'bottom';
type Directions = Array<Direction>;

export type ResizableBoxProps = {
    children: React.ReactNode;
    directions: Directions;
    isLocked?: boolean;
    width?: number;
    minWidth?: number;
    maxWidth?: number;
    height?: number;
    minHeight?: number;
    maxHeight?: number;
    updateWidthOnWindowResize?: boolean;
    updateHeightOnWindowResize?: boolean;
    zIndex?: ZIndexValues;
    onWidthResizeEnd?: (width: number) => void;
    onHeightResizeEnd?: (height: number) => void;
};

type ResizerHandlersProps = {
    $highlightDirection: Direction | null;
    $zIndex?: ZIndexValues;
};

type ResizersProps = ResizerHandlersProps & {
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

const Resizers = styled.div<ResizersProps>(
    ({ $width, $minWidth, $maxWidth, $height, $minHeight, $maxHeight, $isResizing }) => `
        ${$width ? `width: ${$width}px;` : 'width: auto;'};
        ${$minWidth && `min-width: ${$minWidth}px;`};
        ${$maxWidth && `max-width: ${$maxWidth}px;`};
        ${$height ? `height: ${$height}px;` : 'height: auto;'};
        ${$minHeight && `min-height: ${$minHeight}px;`};
        ${$maxHeight && `max-height: ${$maxHeight}px;`};
        box-sizing: border-box;
        position: relative;
        ${
            $isResizing &&
            `user-select: none;
            -webkit-user-select: none;`
        };
    `,
);

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
    updateWidthOnWindowResize = false,
    updateHeightOnWindowResize = false,
    zIndex = zIndices.draggableComponent,
    onWidthResizeEnd,
    onHeightResizeEnd,
}: ResizableBoxProps) => {
    const resizableBoxRef = useRef<HTMLDivElement>(null);

    const [newX, setNewX] = useState<number>(0);
    const [newY, setNewY] = useState<number>(0);
    const [newWidth, setNewWidth] = useState<number>(width || minWidth);
    const [newHeight, setNewHeight] = useState<number>(height || minHeight);
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [isHovering, setIsHovering] = useState<boolean>(false);
    const [direction, setDirection] = useState<Direction | null>(null);

    const resizeCooldown = createCooldown(150);

    const resize = useCallback(
        (e: MouseEvent) => {
            e.preventDefault();

            const mouseX = e.pageX;
            const mouseY = e.pageY;

            const difX = mouseX - newX - newWidth;
            const difY = mouseY - newY - newHeight;

            let result = 0;

            if (direction === 'top') {
                result = ensureMinimalSize(-difY);

                if (difY < 0) {
                    setNewHeight(getMaxResult(maxHeight, result));
                } else if (difX > 0) {
                    setNewHeight(getMinResult(minHeight, result));
                }
            } else if (direction === 'bottom') {
                result = ensureMinimalSize(newHeight + difY);

                if (difY > 0) {
                    setNewHeight(getMaxResult(maxHeight, result));
                } else if (difX < 0) {
                    setNewHeight(getMinResult(minHeight, result));
                }
            } else if (direction === 'left') {
                result = ensureMinimalSize(-difX);

                if (difX < 0) {
                    setNewWidth(getMaxResult(maxWidth, result));
                } else if (difX > 0) {
                    setNewWidth(getMinResult(minWidth, result));
                }
            } else if (direction === 'right') {
                result = ensureMinimalSize(newWidth + difX);

                if (difX > 0) {
                    setNewWidth(getMaxResult(maxWidth, result));
                } else if (difX < 0) {
                    setNewWidth(getMinResult(minWidth, result));
                }
            } else if (direction === null) {
                return;
            }
        },
        [direction, maxHeight, maxWidth, minHeight, minWidth, newHeight, newWidth, newX, newY],
    );

    const startResizing = (direction: Direction) => {
        setIsResizing(true);
        setIsHovering(false);
        setDirection(direction);
    };

    useEffect(() => {
        if (resizableBoxRef.current) {
            const rect = resizableBoxRef.current.getBoundingClientRect();
            setNewX(rect.x);
            setNewY(rect.y);

            if (newWidth === 0) {
                setNewWidth(rect.width);
            }
            if (newHeight === 0) {
                setNewHeight(rect.height);
            }
        }

        document.onmousemove = event => {
            if (isResizing && direction !== null && resizeCooldown() === true) {
                resize(event);
            }
        };

        document.onmouseup = () => {
            if (isResizing) {
                setIsResizing(false);
                if (onWidthResizeEnd) {
                    onWidthResizeEnd(newWidth);
                }
                if (onHeightResizeEnd) {
                    onHeightResizeEnd(newHeight);
                }
            }
        };

        window.onresize = () => {
            if (resizeCooldown() === true) {
                if (updateHeightOnWindowResize) {
                    setNewHeight(getMaxResult(maxHeight, window.innerHeight));
                }
                if (updateWidthOnWindowResize) {
                    setNewWidth(getMaxResult(maxWidth, window.innerWidth));
                }
            }
        };
    }, [
        direction,
        directions,
        isResizing,
        maxHeight,
        maxWidth,
        newHeight,
        newWidth,
        onHeightResizeEnd,
        onWidthResizeEnd,
        resizableBoxRef,
        resize,
        resizeCooldown,
        updateHeightOnWindowResize,
        updateWidthOnWindowResize,
    ]);

    const handleMouseOverDirection = (direction: Direction) => {
        if (!isResizing) {
            setIsHovering(true);
            setDirection(direction);
        }
    };

    const highlightDirection = isHovering || isResizing ? direction : null;

    const handleMouseOver = (direction: Direction) => () => handleMouseOverDirection(direction);

    const handleMouseDown = (direction: Direction) => () => startResizing(direction);

    const handleMouseOut = () => {
        if (isHovering) {
            setIsHovering(false);
        }

        if (!isResizing && direction !== null) {
            setDirection(null);
        }
    };

    const divsProps = (direction: Direction) => {
        return {
            onMouseDown: handleMouseDown(direction),
            onMouseOver: handleMouseOver(direction),
            onMouseOut: handleMouseOut,
            $highlightDirection: highlightDirection,
            $zIndex: zIndex,
        };
    };

    return (
        <Resizers
            $width={newWidth}
            $minWidth={minWidth}
            $maxWidth={maxWidth}
            $height={newHeight}
            $minHeight={minHeight}
            $maxHeight={maxHeight}
            ref={resizableBoxRef}
            $highlightDirection={highlightDirection}
            $isResizing={isResizing}
            $zIndex={zIndex}
        >
            <Child $isResizing={isResizing} $highlightDirection={highlightDirection}>
                {children}
            </Child>
            {!isLocked && (
                <>
                    {directions.includes('top') && <TopHandler {...divsProps('top')} />}
                    {directions.includes('left') && <LeftHandler {...divsProps('left')} />}
                    {directions.includes('bottom') && <BottomHandler {...divsProps('bottom')} />}
                    {directions.includes('right') && <RightHandler {...divsProps('right')} />}
                </>
            )}
        </Resizers>
    );
};
