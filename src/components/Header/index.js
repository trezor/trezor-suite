/* @flow */
import React from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import colors from 'config/colors';
import { SCREEN_SIZE } from 'config/variables';
import type { toggleSidebar as toggleSidebarType } from 'actions/WalletActions';

const Wrapper = styled.header`
    width: 100%;
    height: 52px;
    background: ${colors.HEADER};
    overflow: hidden;
    z-index: 200;

    svg {
        fill: ${colors.WHITE};
        height: 28px;
        width: 100px;
    }
`;

const LayoutWrapper = styled.div`
    width: 100%;
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
    cursor: pointer;
    user-select: none;
    padding: 10px 0px;
    transition: all .1s ease-in;

    @media screen and (max-width: ${SCREEN_SIZE.SM}) {
        display: initial;
    }
`;

const Logo = styled.div`
    flex: 1;
    justify-content: flex-start;
    display: flex;

    @media screen and (max-width: ${SCREEN_SIZE.SM}) {
        flex: 1 0 33%;
        justify-content: center;
    }
`;

const MenuLinks = styled.div`
    flex: 0;

    @media screen and (max-width: ${SCREEN_SIZE.SM}) {
        flex: 0 1 33%;
    }
`;

const Projects = styled.div`

    @media screen and (max-width: ${SCREEN_SIZE.SM}) {
        display: none;
    }
`;

const A = styled.a`
    color: ${colors.WHITE};
    margin-left: 24px;
    transition: all .1s ease-in;

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

type Props = {
    sidebarEnabled?: boolean,
    sidebarOpened?: boolean,
    toggleSidebar?: toggleSidebarType,

};

const Header = ({ sidebarEnabled, sidebarOpened, toggleSidebar }: Props) => (
    <Wrapper>
        <LayoutWrapper>
            <Left>
                { sidebarEnabled && <MenuToggler onClick={toggleSidebar}>{sidebarOpened ? '✕ Close' : '☰ Menu'}</MenuToggler>}
            </Left>
            <Logo>
                <NavLink to="/">
                    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 163.7 41.9" width="100%" height="100%" preserveAspectRatio="xMinYMin meet">
                        <polygon points="101.1,12.8 118.2,12.8 118.2,17.3 108.9,29.9 118.2,29.9 118.2,35.2 101.1,35.2 101.1,30.7 110.4,18.1 101.1,18.1" />
                        <path d="M158.8,26.9c2.1-0.8,4.3-2.9,4.3-6.6c0-4.5-3.1-7.4-7.7-7.4h-10.5v22.3h5.8v-7.5h2.2l4.1,7.5h6.7L158.8,26.9z M154.7,22.5 h-4V18h4c1.5,0,2.5,0.9,2.5,2.2C157.2,21.6,156.2,22.5,154.7,22.5z" />
                        <path d="M130.8,12.5c-6.8,0-11.6,4.9-11.6,11.5s4.9,11.5,11.6,11.5s11.7-4.9,11.7-11.5S137.6,12.5,130.8,12.5z M130.8,30.3 c-3.4,0-5.7-2.6-5.7-6.3c0-3.8,2.3-6.3,5.7-6.3c3.4,0,5.8,2.6,5.8,6.3C136.6,27.7,134.2,30.3,130.8,30.3z" />
                        <polygon points="82.1,12.8 98.3,12.8 98.3,18 87.9,18 87.9,21.3 98,21.3 98,26.4 87.9,26.4 87.9,30 98.3,30 98.3,35.2 82.1,35.2 " />
                        <path d="M24.6,9.7C24.6,4.4,20,0,14.4,0S4.2,4.4,4.2,9.7v3.1H0v22.3h0l14.4,6.7l14.4-6.7h0V12.9h-4.2V9.7z M9.4,9.7 c0-2.5,2.2-4.5,5-4.5s5,2,5,4.5v3.1H9.4V9.7z M23,31.5l-8.6,4l-8.6-4V18.1H23V31.5z" />
                        <path d="M79.4,20.3c0-4.5-3.1-7.4-7.7-7.4H61.2v22.3H67v-7.5h2.2l4.1,7.5H80l-4.9-8.3C77.2,26.1,79.4,24,79.4,20.3z M71,22.5h-4V18 h4c1.5,0,2.5,0.9,2.5,2.2C73.5,21.6,72.5,22.5,71,22.5z" />
                        <polygon points="40.5,12.8 58.6,12.8 58.6,18.1 52.4,18.1 52.4,35.2 46.6,35.2 46.6,18.1 40.5,18.1 " />
                    </svg>
                </NavLink>
            </Logo>
            <MenuLinks>
                <Projects>
                    <A href="https://trezor.io/" target="_blank" rel="noreferrer noopener">Trezor</A>
                    <A href="https://wiki.trezor.io/" target="_blank" rel="noreferrer noopener">Wiki</A>
                    <A href="https://blog.trezor.io/" target="_blank" rel="noreferrer noopener">Blog</A>
                    <A href="https://trezor.io/support/" target="_blank" rel="noreferrer noopener">Support</A>
                </Projects>
            </MenuLinks>
        </LayoutWrapper>
    </Wrapper>
);

export default Header;