import * as React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import Icon from '../Icon';
import { SCREEN_SIZE } from '../../config/variables';
import icons from '../../config/icons';
import colors from '../../config/colors';
import TrezorLogo from '../TrezorLogo';

const Wrapper = styled.header`
    width: 100%;
    height: 52px;
    background: ${colors.HEADER};
    z-index: 200;
`;

const LayoutWrapper = styled.div`
    height: 100%;
    max-width: 1170px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;

    @media screen and (max-width: 1170px) {
        padding: 0 25px;
    }
`;

const Left = styled.div`
    display: none;
    flex: 0 0 33%;

    @media screen and (max-width: ${SCREEN_SIZE.SM}) {
        display: initial;
    }
`;

const MenuToggler = styled.div`
    display: none;
    white-space: nowrap;
    color: ${colors.WHITE};
    align-self: center;
    align-items: center;
    cursor: pointer;
    user-select: none;
    padding: 10px 0px;
    transition: all 0.1s ease-in;

    @media screen and (max-width: ${SCREEN_SIZE.SM}) {
        display: flex;
    }
`;

const TogglerText = styled.div`
    margin-left: 6px;
`;

const TREZOR = styled.div``;
const T = styled.div``;

const Logo = styled.div`
    flex: 1;
    justify-content: flex-start;
    display: flex;

    ${T} {
        display: none;
        width: 20px;
    }

    ${TREZOR} {
        width: 100px;
    }

    svg {
        fill: ${colors.WHITE};
        height: 28px;
    }

    @media screen and (max-width: ${SCREEN_SIZE.SM}) {
        flex: 1 0 33%;
        justify-content: center;
    }

    @media screen and (max-width: ${SCREEN_SIZE.XS}) {
        /* hides full width trezor logo, shows only trezor icon */
        ${TREZOR} {
            display: none;
        }

        ${T} {
            display: inherit;
        }
    }
`;

const MenuLinks = styled.div`
    display: flex;
    align-content: center;
    justify-content: flex-end;
    flex: 0;
    height: 100%;

    @media screen and (max-width: ${SCREEN_SIZE.SM}) {
        flex: 0 1 33%;
    }
`;

const Projects = styled.div`
    display: flex;
    align-items: center;
    height: 100%;

    @media screen and (max-width: ${SCREEN_SIZE.SM}) {
        display: none;
    }
`;

const Divider = styled.div`
    border-right: 1px solid ${colors.HEADER_DIVIDER};
    height: 100%;
    margin: 0 24px;

    @media screen and (max-width: ${SCREEN_SIZE.SM}) {
        display: none;
    }
`;

const A = styled.a`
    color: ${colors.WHITE};
    margin-left: 24px;
    transition: all 0.1s ease-in;
    white-space: nowrap;
    text-decoration: none;

    &:visited {
        color: ${colors.WHITE};
        margin-left: 24px;
    }

    &:first-child {
        margin: 0px;
    }

    &:hover,
    &:active {
        color: ${colors.TEXT_SECONDARY};
    }
`;

interface LinkShape {
    title: string;
    href: string;
}

interface Props {
    sidebarEnabled: boolean;
    sidebarOpened?: boolean;
    toggleSidebar?: () => any;
    togglerOpenText?: React.ReactNode;
    togglerCloseText?: React.ReactNode;
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
    const logoImage = (
        <>
            <TREZOR>
                <TrezorLogo type="horizontal" variant="white" width="100%" />
            </TREZOR>
            <T>
                <TrezorLogo type="symbol" variant="white" width="100%" />
            </T>
        </>
    );
    const LinkWrapper = logoLinkComponent
        ? React.cloneElement(logoLinkComponent as React.ReactElement<any>, {}, logoImage)
        : logoImage;

    return (
        <Wrapper {...rest}>
            <LayoutWrapper>
                <Left>
                    {sidebarEnabled && (
                        <MenuToggler onClick={toggleSidebar}>
                            {sidebarOpened ? (
                                <>
                                    <Icon size={12} color={colors.WHITE} icon={icons.CLOSE} />
                                    <TogglerText>{togglerCloseText}</TogglerText>
                                </>
                            ) : (
                                <>
                                    <Icon color={colors.WHITE} size={14} icon={icons.MENU} />
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
                                <A
                                    key={link.href}
                                    href={link.href}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                >
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

Header.propTypes = {
    sidebarEnabled: PropTypes.bool,
    sidebarOpened: PropTypes.bool,
    toggleSidebar: PropTypes.func,
    rightAddon: PropTypes.node,
    togglerOpenText: PropTypes.node,
    togglerCloseText: PropTypes.node,
    logoLinkComponent: PropTypes.node,
    links: PropTypes.arrayOf(
        PropTypes.shape({
            href: PropTypes.string,
            title: PropTypes.node,
        })
    ),
};

export default Header;
