import { useEffect, useContext, ComponentType } from 'react';
import { LayoutContext, SideMenuProps } from '@suite-components/SuiteLayout/LayoutContext';

export const useLayout = (
    title?: string,
    TopMenu?: ComponentType,
    SideMenu?: ComponentType<SideMenuProps>,
) => {
    const setLayout = useContext(LayoutContext);

    useEffect(() => {
        setLayout({ title, TopMenu, SideMenu });
    }, [setLayout, title, TopMenu, SideMenu]);
};
