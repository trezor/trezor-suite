import styled from 'styled-components';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createCooldown } from '@trezor/utils';

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
};

type ResizersProps = {
    $width?: number;
    $minWidth?: number;
    $maxWidth?: number;
    $height?: number;
    $minHeight?: number;
    $maxHeight?: number;

    $highlightDirection?: Direction | null;
    $isResizing?: boolean;
};

const MINIMAL_BOX_SIZE = 1;
const REACTIVE_AREA_WIDTH = 15;

const Resizers = styled.div<ResizersProps>(
    ({
        $width,
        $minWidth,
        $maxWidth,
        $height,
        $minHeight,
        $maxHeight,
        $highlightDirection,
        $isResizing,
        theme,
    }) => `
        ${$width ? `width: ${$width}px;` : 'width: auto;'};
        ${$minWidth && `min-width: ${$minWidth}px;`};
        ${$maxWidth && `max-width: ${$maxWidth}px;`};
        ${$height ? `height: ${$height}px;` : 'height: auto;'};
        ${$minHeight && `min-height: ${$minHeight}px;`};
        ${$maxHeight && `max-height: ${$maxHeight}px;`};
        box-sizing: border-box;
        position: relative;

        ${$isResizing && `user-select: none;`};

        &::after {
            content:'';
            position: absolute;
            top: 0;
            left: 0;
            display:block;
            width: 100%;
            height: 100%;
            pointer-events: none;
            ${
                $highlightDirection !== null
                    ? `border-${$highlightDirection}: 3px solid ${theme.borderFocus};`
                    : ''
            };
        }
    `,
);

const TopHandler = styled.div`
    position: absolute;
    width: 100%;
    height: ${REACTIVE_AREA_WIDTH}px;
    cursor: ns-resize;
    top: ${`-${REACTIVE_AREA_WIDTH / 2}px`};
`;

const BottomHandler = styled.div`
    position: absolute;
    width: 100%;
    height: ${REACTIVE_AREA_WIDTH}px;
    cursor: ns-resize;
    bottom: ${`-${REACTIVE_AREA_WIDTH / 2}px`};
`;

const LeftHandler = styled.div`
    position: absolute;
    width: ${REACTIVE_AREA_WIDTH}px;
    height: 100%;
    bottom: 0;
    cursor: ew-resize;
    left: ${`-${REACTIVE_AREA_WIDTH / 2}px`};
`;

const RightHandler = styled.div`
    position: absolute;
    width: ${REACTIVE_AREA_WIDTH}px;
    height: 100%;
    bottom: 0;
    cursor: ew-resize;
    right: ${`-${REACTIVE_AREA_WIDTH / 2}px`};
`;

const Child = styled(Resizers)`
    position: relative;
    width: 100%;
    height: 100%;
    overflow: auto;
`;

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
            if (isResizing === true && direction !== null && resizeCooldown() === true) {
                resize(event);
            }
        };

        document.onmouseup = () => setIsResizing(false);
    }, [direction, isResizing, newHeight, newWidth, resizableBoxRef, resize, resizeCooldown]);

    const handleMouseOverDirection = (direction: Direction) => {
        if (isResizing === false) {
            setIsHovering(true);
            setDirection(direction);
        }
    };

    const highlightDirection = () =>
        isHovering === true || isResizing === true ? direction : null;

    const handleMouseOver = (direction: Direction) => () => handleMouseOverDirection(direction);

    const handleMouseDown = (direction: Direction) => () => startResizing(direction);

    const handleMouseOut = () => {
        if (isHovering === true) {
            setIsHovering(false);
        }

        if (isResizing !== true && direction !== null) {
            setDirection(null);
        }
    };

    const divsProps = (direction: Direction) => {
        return {
            onMouseDown: handleMouseDown(direction),
            onMouseOver: handleMouseOver(direction),
            onMouseOut: handleMouseOut,
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
            $highlightDirection={highlightDirection()}
            $isResizing={isResizing}
        >
            <Child>{children}</Child>
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
