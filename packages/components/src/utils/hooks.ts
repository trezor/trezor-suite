import { useState, useEffect } from 'react';
import { useTheme as useSCTheme } from 'styled-components';
import { SuiteThemeColors } from '../support/types';

export const useKeyPress = (targetKey: string) => {
    // State for keeping track of whether key is pressed
    const [keyPressed, setKeyPressed] = useState(false);

    // If pressed key is our target key then set to true
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const downHandler = (event: KeyboardEvent) => {
        if (event.key === targetKey) {
            setKeyPressed(true);
        }
    };

    // If released key is our target key then set to false
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const upHandler = (event: KeyboardEvent) => {
        if (event.key === targetKey) {
            setKeyPressed(false);
        }
    };

    // Add event listeners
    useEffect(() => {
        window.addEventListener('keydown', downHandler);
        window.addEventListener('keyup', upHandler);
        // Remove event listeners on cleanup
        return () => {
            window.removeEventListener('keydown', downHandler);
            window.removeEventListener('keyup', upHandler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty array ensures that effect is only run on mount and unmount

    return keyPressed;
};

export const useOnClickOutside = (
    elementRefs: React.MutableRefObject<HTMLElement | null>[],
    callback: (event: MouseEvent | TouchEvent) => void
) => {
    useEffect(() => {
        if (!elementRefs?.length) return;
        const listener = (event: MouseEvent | TouchEvent) => {
            let clickInsideElements = false;

            elementRefs.forEach(elRef => {
                // Do nothing if clicking ref's element or descendent elements
                if (!elRef.current || elRef.current.contains(event.target as Node)) {
                    clickInsideElements = true;
                }
            });
            if (clickInsideElements) return;

            callback(event);
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [elementRefs, callback]);
};

export const useTheme = () => {
    const theme = useSCTheme();
    return theme;
};
