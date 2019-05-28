import * as React from 'react';

interface LinkShape {
    title: string;
    href: string;
}

interface Props {
    sidebarEnabled: boolean;
    sidebarOpened?: boolean;
    toggleSidebar?: () => any;
    togglerOpenText?: string;
    togglerCloseText?: string;
    rightAddon?: React.ReactNode;
    logoLinkComponent?: React.ReactNode;
    links?: LinkShape[];
}

const Header = ({
    sidebarEnabled,
    sidebarOpened,
    toggleSidebar,
    togglerOpenText,
    togglerCloseText,
    rightAddon,
    logoLinkComponent,
    links,
}: Props) => {
    return null;
};

export default Header;
