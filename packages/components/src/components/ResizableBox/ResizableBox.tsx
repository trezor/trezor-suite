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

const reactiveAreaWidth = '15px';

type ResizersProps = {
    $width?: number;
    $minWidth?: number;
    $maxWidth?: number;
    $height?: number;
    $minHeight?: number;
    $maxHeight?: number;
    x?: number; // TODO not really used
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
          height: ${reactiveAreaWidth};
          cursor: ns-resize;
        }

        #left-div, #right-div {
          width: ${reactiveAreaWidth};
          height: 100%;
          bottom: 0;
          cursor: ew-resize;
        }

        #top-div {
          top: ${`-${reactiveAreaWidth}`};
        }

        #left-div {
          left: ${`-${reactiveAreaWidth}`};
        }

        #right-div {
          right: ${`-${reactiveAreaWidth}`};
        }

        #bottom-div {
          bottom: ${`-${reactiveAreaWidth}`};
        }
    `
);

const Child = styled(Resizers)`
    position: relative;
    width: 100%;
    height: 100%;
    overflow: scroll;
`

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

    const [newX, setNewX] = useState<number | undefined>(undefined);
    const [newY, setNewY] = useState<number | undefined>(undefined);
    const [newWidth, setNewWidth] = useState<number>(width || minWidth || 0);
    const [newHeight, setNewHeight] = useState<number>(height || minHeight || 0);

    useEffect(() => {
        // const resizers = Array.from(document.querySelectorAll(
        //   directions.map(direction => `#${direction}-div`)
        //   .join(', ')
        // )) as Array<HTMLDivElement>;

        // Note: adding event listers inside loop doesn't work
        // resizers.forEach((resizer) => {
        //   const myCallback = () => handleMouseDown(resizer.id);
        //   resizer.addEventListener('mousedown', myCallback);
        // });

        directions.includes('bottom') && document.querySelector('#bottom-div')?.addEventListener('mousedown', () => handleMouseDown('bottom-div'));
        directions.includes('top') && document.querySelector('#top-div')?.addEventListener('mousedown', () => handleMouseDown('top-div'));
        directions.includes('left') && document.querySelector('#left-div')?.addEventListener('mousedown', () => handleMouseDown('left-div'));
        directions.includes('right') && document.querySelector('#right-div')?.addEventListener('mousedown', () => handleMouseDown('right-div'));

        if (resizableBoxRef.current) {
            const rect = resizableBoxRef.current.getBoundingClientRect(); // TODO sometimes returns incorrect values
            setNewX(rect.x);
            setNewY(rect.y);
            !(width || minWidth) && setNewWidth(rect.width);
            !(height || minHeight) && setNewHeight(rect.height);
        }
    }, [directions, resizableBoxRef.current]);

    const resize = (resizer: string, e: MouseEvent) => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        const difX = mouseX - (newX ?? 0) - newWidth;
        const difY = mouseY - (newY ?? 0) - newHeight;

        let result = 0;

        switch (resizer) {
            // case 'top': // TODO how exactly should it behave?
            //   break;
            case 'left': // TODO how exactly should it behave?
                result = -1*difX;
                result = result < 0 ? 1 : result;

                if (difX < 0) {
                    maxWidth
                        ? setNewWidth(result < maxWidth ? result : maxWidth)
                        : setNewWidth(result);
                }
                difX > 0 && setNewWidth(result > minWidth ? result : minWidth);
                // setNewX(mouseX);

                break;
            case 'right':
                result = newWidth + difX;
                result = result < 0 ? 1 : result;

                if (difX > 0) {
                    maxWidth
                        ? setNewWidth(result < maxWidth ? result : maxWidth)
                        : setNewWidth(result);
                }
                difX < 0 && setNewWidth(result > minWidth ? result : minWidth);

                break;
            case 'bottom':
                result = newHeight + difY;
                result = result < 0 ? 1 : result;

                if (difY > 0) {
                    maxHeight
                        ? setNewHeight(result < maxHeight ? result : maxHeight)
                        : setNewHeight(result);
                }
                difX < 0 && setNewHeight(result > minHeight ? result : minHeight);

                break;
            default:
              break;
        };
    };

    const handleMouseDown = (resizerID: string) => {
        const resizeCallback = (e: MouseEvent) => resize(resizerID.split('-')[0], e);
        const stopResize = () => {
            window.removeEventListener('mousemove', resizeCallback);
        };

        window.addEventListener('mousemove', resizeCallback);
        window.addEventListener('mouseup', stopResize as EventListener);
    };

    return (
        <Resizers
            $width={newWidth}
            $minWidth={minWidth}
            $maxWidth={maxWidth}
            $height={newHeight}
            $minHeight={minHeight}
            $maxHeight={maxHeight}
            x={newX}
            y={newY}
            ref={resizableBoxRef}
        >
            <Child>{children}</Child>
            {!isLocked && directions.map((direction) => (
                <div id={`${direction}-div`} key={direction} />
            ))}
        </Resizers>
    );
};
