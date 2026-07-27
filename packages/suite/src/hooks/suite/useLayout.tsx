import { type ReactNode, useContext, useEffect } from 'react';

import { LayoutContext } from 'src/support/suite/LayoutContext';

export const useLayout = (title?: string, layoutHeader?: ReactNode, layoutFooter?: ReactNode) => {
    const setLayout = useContext(LayoutContext);

    useEffect(() => {
        setLayout({ title, layoutHeader, layoutFooter });
    }, [setLayout, title, layoutHeader, layoutFooter]);
};
