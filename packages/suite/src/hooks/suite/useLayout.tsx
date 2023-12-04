import { useEffect, useContext, ComponentType } from 'react';

import { LayoutContext } from 'src/support/suite/LayoutContext';

export const useLayout = (title?: string, TopMenu?: ComponentType) => {
    const setLayout = useContext(LayoutContext);

    useEffect(() => {
        setLayout({ title, TopMenu });
    }, [setLayout, title, TopMenu]);
};
