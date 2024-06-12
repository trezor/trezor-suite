import styled from 'styled-components';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createCooldown } from '@trezor/utils';

type Directions = 'top' | 'left' | 'right' | 'bottom';

export type ResizableBoxProps = {
    children: React.ReactNode;
    directions: Array<Directions>;
    isLocked?: boolean; // if true, it's not possible to resize the component
    width?: number;
    minWidth?: number;
    maxWidth?: number;
    height?: number;
    minHeight?: number;
    maxHeight?: number;
};

const reactiveAreaWidth = 15;

type ResizersProps = {
    $width?: number;
    $minWidth?: number;
    $maxWidth?: number;
    $height?: number;
    $minHeight?: number;
    $maxHeight?: number;

    $highlightDirection?: Directions;
    $isResizing?: boolean;
};

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
        //box-sizing: border-box;
        position: relative;

        box-sizing: content-box;
        ${$highlightDirection !== undefined && `border-${$highlightDirection}: 3px solid ${theme.backgroundNeutralSubdued};`};
        ${$isResizing && `user-select: none;`};
    `,
);

const TopDiv = styled.div`
    position: absolute;
    width: 100%;
    height: ${reactiveAreaWidth}px;
    cursor: ns-resize;
    top: ${`-${reactiveAreaWidth / 2}px`};
`;

const BottomDiv = styled.div`
    position: absolute;
    width: 100%;
    height: ${reactiveAreaWidth}px;
    cursor: ns-resize;
    bottom: ${`-${reactiveAreaWidth / 2}px`};
`;

const LeftDiv = styled.div`
    position: absolute;
    width: ${reactiveAreaWidth}px;
    height: 100%;
    bottom: 0;
    cursor: ew-resize;
    left: ${`-${reactiveAreaWidth / 2}px`};
`;

const RightDiv = styled.div`
    position: absolute;
    width: ${reactiveAreaWidth}px;
    height: 100%;
    bottom: 0;
    cursor: ew-resize;
    right: ${`-${reactiveAreaWidth / 2}px`};
`;

const Child = styled(Resizers)`
    position: relative;
    width: 100%;
    height: 100%;
    overflow: auto;
`;

// make sure the final width or height will be at least 1px while resizing, to make sure the box doesn't disappear
const ensureMinimalSize = (size: number): number => (size < 1 ? 1 : size);

// get the final width/height when resizing according to the minWidth/minHeight
const getMinResult = (min: number, result: number) => (result > min ? result : min);

// get the final width/height when resizing according to the maxWidth/maxHeight
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
    const [direction, setDirection] = useState<Directions>();

    const [isHovering, setIsHovering] = useState(false);

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
            }
        },
        [direction, maxHeight, maxWidth, minHeight, minWidth, newHeight, newWidth, newX, newY],
    );

    const startResizing = (direction: Directions) => {
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
            if (resizeCooldown() === true && isResizing === true && direction !== undefined) {
                resize(event);
            }
        };

        document.onmouseup = () => setIsResizing(false);
    }, [direction, isResizing, newHeight, newWidth, resizableBoxRef, resize, resizeCooldown]);

    const handleMouseOver = (direction: Directions) => {
        if (isResizing === false) {
            setIsHovering(true);
            setDirection(direction);
        }
    };

    const handleMouseOut = () => {
        if (isHovering === true) {
            setIsHovering(false);
        }

        if (direction !== undefined) {
            setDirection(undefined);
        }
    };

    const highlightDirection = useMemo(
        () => (isHovering === true ? direction : undefined),
        [direction, isHovering],
    );

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
        >
            <Child>{children}</Child>
            {!isLocked && (
                <>
                    {directions.includes('top') && (
                        <TopDiv
                            onMouseDown={() => startResizing('top')}
                            onMouseOver={() => handleMouseOver('top')}
                            onMouseOut={handleMouseOut}
                        />
                    )}
                    {directions.includes('left') && (
                        <LeftDiv
                            onMouseDown={() => startResizing('left')}
                            onMouseOver={() => handleMouseOver('left')}
                            onMouseOut={handleMouseOut}
                        />
                    )}
                    {directions.includes('bottom') && (
                        <BottomDiv onMouseDown={() => startResizing('bottom')} />
                    )}
                    {directions.includes('right') && (
                        <RightDiv onMouseDown={() => startResizing('right')} />
                    )}
                </>
            )}
        </Resizers>
    );
};
