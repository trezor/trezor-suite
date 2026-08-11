import { type ReactNode, useEffect, useRef } from 'react';

import { useScrollView } from './ScrollViewContext';

type ScrollToEndOnMountProps = {
    children: ReactNode;
};

export const ScrollToEndOnMount = ({ children }: ScrollToEndOnMountProps) => {
    const scrollView = useScrollView();
    const wasScrolled = useRef(false);

    useEffect(() => {
        if (scrollView && !wasScrolled.current) {
            wasScrolled.current = true;
            scrollView.scrollToEnd({ animated: true });
        }
    }, [scrollView]);

    return children;
};
