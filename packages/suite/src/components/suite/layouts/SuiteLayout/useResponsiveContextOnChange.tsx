import { useEffect, useRef } from 'react';

import { useDebounce } from '@trezor/react-utils';

import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';

const THRESHOLD_SIZE = 8;

export const useResponsiveContextOnChange = (ref: React.RefObject<HTMLDivElement | null>) => {
    const { setContentWidth } = useResponsiveContext();
    const debounce = useDebounce();
    const lastWidthRef = useRef<number | null>(null);

    useEffect(() => {
        if (!ref.current) return;

        const resizeObserver = new ResizeObserver(entries => {
            const entry = entries[0];
            if (!entry) return;

            const newWidth = entry.contentRect.width;

            if (
                lastWidthRef.current !== null &&
                Math.abs(lastWidthRef.current - newWidth) < THRESHOLD_SIZE
            ) {
                return;
            }

            lastWidthRef.current = newWidth;

            debounce(() => {
                setContentWidth(newWidth);
            });
        });

        const rect = ref.current.getBoundingClientRect();
        lastWidthRef.current = rect.width;
        setContentWidth(rect.width);

        resizeObserver.observe(ref.current);

        return () => resizeObserver.disconnect();
    }, [ref, debounce, setContentWidth]);
};
