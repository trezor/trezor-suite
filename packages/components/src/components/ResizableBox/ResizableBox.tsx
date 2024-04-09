import styled from 'styled-components';
import { useEffect, useRef, useState } from 'react';

export type ResizableBoxProps = {
    children: React.ReactNode;
    directions: Array<"top" | "left" | "right" | "bottom">; 
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
    x?: number;
    y?: number;
};

const Resizers = styled.div<ResizersProps>(({ $width, $minWidth, $maxWidth, $height, $minHeight, $maxHeight, x, y }) => `
        ${$width ? `width: ${$width}px;` : 'width: auto;'};
        ${$minWidth && `min-width: ${$minWidth}px;`};
        ${$maxWidth && `max-width: ${$maxWidth}px;`};
        ${$height ? `height: ${$height}px;` : 'height: auto;'};
        ${$minHeight && `min-height: ${$minHeight}px;`};
        ${$maxHeight && `max-height: ${$maxHeight}px;`};
        // ${x && `left: ${x}px;`};
        // ${y && `top: ${y}px;`};
        box-sizing: border-box;
        position: relative;

        #top-div, #left-div, #right-div, #bottom-div {
          position: absolute;
        }

        #top-div, #bottom-div {
          width: 100%;
          height: ${reactiveAreaWidth}px;
          cursor: ns-resize;
        }

        #left-div, #right-div {
          width: ${reactiveAreaWidth}px;
          height: 100%;
          bottom: 0;
          cursor: ew-resize;
        }

        #top-div {
          top: ${`-${reactiveAreaWidth/2}px`};
        }

        #left-div {
          left: ${`-${reactiveAreaWidth/2}px`};
        }

        #right-div {
          right: ${`-${reactiveAreaWidth/2}px`};
        }

        #bottom-div {
          bottom: ${`-${reactiveAreaWidth/2}px`};
        }
    `
);

const Child = styled(Resizers)`
    position: relative;
    width: 100%;
    height: 100%;
    overflow: auto;
`

// TODO maybe move the following helper functions to a separate file

// make sure the final width or height will be at least 1px while resizing, to make sure the box doesn't disappear
const ensureMinimalSize = (size: number): number =>
    size < 1 ? 1 : size;

// get the final width/height when resizing according to the minWidth/minHeight
const getMinResult = (min: number, result: number) =>
    result > min ? result : min;

// get the final width/height when resizing according to the maxWidth/maxHeight
const getMaxResult = (max: number | undefined, result: number) =>
    (max === undefined || result < max) ? result : max;

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

    const resize = (resizer: string, e: MouseEvent) => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        const difX = mouseX - (newX) - newWidth;
        const difY = mouseY - (newY) - newHeight;

        let result = 0;

        // TODO fix the computations, it's all kinda moved more than expected/before!
        if (resizer === 'top') { // TODO find a way to display box to resize from top in storybook nicely
            result = ensureMinimalSize(-difY);

            if (difY < 0) {
                setNewHeight(getMaxResult(maxHeight, result));
            } else if (difX > 0) {
                setNewHeight(getMinResult(minHeight, result));
            }
        } else if (resizer === 'bottom') {
            result = ensureMinimalSize(newHeight + difY);

            if (difY > 0) {
                setNewHeight(getMaxResult(maxHeight, result));
            } else if (difX < 0) {
                setNewHeight(getMinResult(minHeight, result));
            }
        } else if (resizer === 'left') {
            result = ensureMinimalSize(-difX);

            if (difX < 0) {
                setNewWidth(getMaxResult(maxWidth, result));
            } else if (difX > 0) {
                setNewWidth(getMinResult(minWidth, result));
            }
        } else if (resizer === 'right') {
            result = ensureMinimalSize(newWidth + difX);

            if (difX > 0) {
                setNewWidth(getMaxResult(maxWidth, result));
            } else if (difX < 0) {
                setNewWidth(getMinResult(minWidth, result));
            }
        }
    };

    const handleMouseDown = (resizerID: string) => {
        const resizeCallback = (e: MouseEvent) => resize(resizerID.split('-')[0], e);
        const stopResize = () => {
            window.removeEventListener('mousemove', resizeCallback);
        };

        window.addEventListener('mousemove', resizeCallback);
        window.addEventListener('mouseup', stopResize); // TODO make sure you remove also this listener!
    };

    useEffect(() => {
        if (directions.includes('top')) {
            document.querySelector('#top-div')?.addEventListener('mousedown', () => handleMouseDown('top-div'));
        }
        if (directions.includes('bottom')) {
            document.querySelector('#bottom-div')?.addEventListener('mousedown', () => handleMouseDown('bottom-div'));
        }
        if (directions.includes('left')) {
            document.querySelector('#left-div')?.addEventListener('mousedown', () => handleMouseDown('left-div'));
        }
        if (directions.includes('right')) {
            document.querySelector('#right-div')?.addEventListener('mousedown', () => handleMouseDown('right-div'));
        }

        if (resizableBoxRef.current) {
            const rect = resizableBoxRef.current.getBoundingClientRect();
            setNewX(rect.x);
            setNewY(rect.y);

            if(newWidth === 0) {
                setNewWidth(rect.width);
            }
            if(newHeight === 0) {
                setNewHeight(rect.height);
            }
        }

        return () => {
            if (directions.includes('top')) {
                document.querySelector('#top-div')?.removeEventListener('mousedown', () => handleMouseDown('top-div'));
            }
            if (directions.includes('bottom')) {
                document.querySelector('#bottom-div')?.removeEventListener('mousedown', () => handleMouseDown('bottom-div'));
            }
            if (directions.includes('left')) {
                document.querySelector('#left-div')?.removeEventListener('mousedown', () => handleMouseDown('left-div'));
            }
            if (directions.includes('right')) {
                document.querySelector('#right-div')?.removeEventListener('mousedown', () => handleMouseDown('right-div'));
            }
        };
    }, [directions, resizableBoxRef]); // TODO maybe update dependencies array

    return (
        <Resizers
            $width={newWidth}
            $minWidth={minWidth}
            $maxWidth={maxWidth}
            $height={newHeight}
            $minHeight={minHeight}
            $maxHeight={maxHeight}
            x={newX} // TODO are we gonna need this?
            y={newY} // TODO are we gonna need this?
            ref={resizableBoxRef}
        >
            <Child>{children}</Child>
            {!isLocked && directions.map((direction) => (
                <div id={`${direction}-div`} key={direction} />
            ))}
        </Resizers>
    );
};
