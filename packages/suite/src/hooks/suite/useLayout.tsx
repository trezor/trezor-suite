import { useEffect, useContext } from 'react';

import { LayoutContext } from 'src/support/suite/LayoutContext';

export const useLayout = (title?: string, layoutHeader?: React.ReactNode) => {
    const setLayout = useContext(LayoutContext);

    useEffect(() => {
        setLayout({ title, layoutHeader });
    }, [setLayout, title, layoutHeader]);
};
