import { useEffect, useRef } from 'react';

export const useWindowFocus = () => {
    const windowFocused = useRef(true);
    useEffect(() => {
        const blurHandler = () => {
            windowFocused.current = false;
        };
        const focusHandler = () => {
            windowFocused.current = true;
        };
        window.addEventListener('blur', blurHandler);
        window.addEventListener('focus', focusHandler);

        return () => {
            window.removeEventListener('blur', blurHandler);
            window.removeEventListener('focus', focusHandler);
        };
    }, []);

    return windowFocused;
};
