import { useEffect, useState } from 'react';

// Sleduje šířku viewportu (nezávislou na sidebaru)
export const useWindowWidth = (debounceMs = 100) => {
    const [width, setWidth] = useState(() => window.innerWidth);

    useEffect(() => {
        let timeout: number | undefined;

        const handleResize = () => {
            clearTimeout(timeout);
            timeout = window.setTimeout(() => {
                setWidth(window.innerWidth);
            }, debounceMs);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            clearTimeout(timeout);
            window.removeEventListener('resize', handleResize);
        };
    }, [debounceMs]);

    return width;
};
