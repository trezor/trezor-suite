import React from 'react';
import styled from 'styled-components/native';
import Icon from '../Icon';
import icons from '../../config/icons';
import colors from '../../config/colors';
import Link from '../Link';
import TrezorLogo from '../TrezorLogo';

const Wrapper = styled.View`
    width: 100%;
    height: 52px;
    background: ${colors.HEADER};
    z-index: 200;
`;

const LayoutWrapper = styled.View`
    flex: 1;
    height: 100%;
    max-width: 1170px;
    margin: 0 auto;
    align-items: center;
    justify-content: space-between;
`;

const Left = styled.View`
    flex: 1;
`;

const MenuToggler = styled.TouchableHighlight<MenuTogglerProps>`
    align-self: center;
    align-items: center;
    padding: 10px 0px;
`;

const TogglerText = styled.Text`
    margin-left: 6px;
`;

const Logo = styled.View`
    flex: 1;
    justify-content: flex-start;
`;

const MenuLinks = styled.View`
    flex: 1;
    align-content: center;
    justify-content: flex-end;
    height: 100%;
`;

const Projects = styled.View`
    flex: 1;
    align-items: center;
    height: 100%;
`;

const Divider = styled.View`
    border-right: 1px solid ${colors.HEADER_DIVIDER};
    height: 100%;
    margin: 0 24px;
`;

const A = styled(Link)`
    color: ${colors.WHITE};
    margin-left: 24px;
    text-decoration: none;
`;

interface MenuTogglerProps {
    onClick?: () => void;
}

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
    ...rest
}: Props) => {
    const LogoImage = <TrezorLogo type="horizontal" width={80} height={20} />;
    const LinkWrapper = logoLinkComponent
        ? React.cloneElement(logoLinkComponent as React.ReactElement<any>, {}, LogoImage)
        : LogoImage;

    return (
        <Wrapper {...rest}>
            <LayoutWrapper>
                <Left>
                    {sidebarEnabled && (
                        <MenuToggler onClick={toggleSidebar}>
                            {sidebarOpened ? (
                                <>
                                    <Icon size={12} color={colors.WHITE} icon="CLOSE" />
                                    <TogglerText>{togglerCloseText}</TogglerText>
                                </>
                            ) : (
                                <>
                                    <Icon color={colors.WHITE} size={14} icon="MENU" />
                                    <TogglerText>{togglerOpenText}</TogglerText>
                                </>
                            )}
                        </MenuToggler>
                    )}
                </Left>
                <Logo>{LinkWrapper}</Logo>
                <MenuLinks>
                    <Projects>
                        {links &&
                            links.map(link => (
                                <A key={link.href} href={link.href} target="_blank">
                                    {link.title}
                                </A>
                            ))}
                    </Projects>
                    {rightAddon && (
                        <>
                            <Divider />
                            {rightAddon}
                        </>
                    )}
                </MenuLinks>
            </LayoutWrapper>
        </Wrapper>
    );
};

export default Header;
