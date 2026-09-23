import { type ReactNode, useContext, useEffect } from 'react';

import { LayoutSetterContext } from 'src/support/suite/LayoutContext';

interface LayoutOptions {
    isContentStatic?: boolean;
}

export const useLayout = (
    title?: string,
    layoutHeader?: ReactNode,
    layoutFooter?: ReactNode,
    layoutOptions?: LayoutOptions,
) => {
    const setLayout = useContext(LayoutSetterContext);
    const { isContentStatic = false } = layoutOptions || {};

    useEffect(() => {
        setLayout({
            title,
            layoutHeader,
            layoutFooter,
            isContentStatic,
        });
    }, [setLayout, title, layoutHeader, layoutFooter, isContentStatic]);
};
