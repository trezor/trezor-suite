import { useEffect } from 'react';

import { useDebounce } from '@trezor/react-utils';

import { useResponsiveContext } from '../../../../support/suite/ResponsiveContext';

export const useResponsiveContextOnChange = (ref: React.RefObject<HTMLDivElement | null>) => {
    const { setContentWidth } = useResponsiveContext();
    const debounce = useDebounce();
    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const newWidth = entries[0].contentRect.width;

                debounce(() => {
                    setContentWidth(newWidth);
                });
            }
        });

        if (ref.current) {
            const boundingRect = ref.current.getBoundingClientRect();

            setContentWidth(boundingRect.width);
            resizeObserver.observe(ref.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [ref, setContentWidth, debounce]);
};
