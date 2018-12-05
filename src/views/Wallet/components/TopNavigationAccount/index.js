/* @flow */

import styled from 'styled-components';
import React from 'react';
import { FONT_SIZE } from 'config/variables';
import { NavLink } from 'react-router-dom';
import colors from 'config/colors';

import type { Location } from 'react-router';

import Indicator from './components/Indicator';

type Props = {
    location: Location;
};

const Wrapper = styled.div`
    position: relative;
    display: flex;
    height: 100%;
    flex: 1;
    align-items: center;
    justify-content: space-between;
    padding: 0px 30px 0 40px;
    max-width: 600px;
`;

const StyledNavLink = styled(NavLink)`
    font-weight: 500;
    font-size: ${FONT_SIZE.TOP_MENU};
    color: ${colors.TEXT_SECONDARY};
    margin: 0px 4px;
    padding: 20px;
    white-space: nowrap;
    
    &.active,
    &:hover {
        transition: all 0.3s ease-in-out;
        color: ${colors.TEXT_PRIMARY};
    }

    &:first-child {
        margin-left: 0px;
    }

    &:last-child {
        margin-right: 0px;
    }
`;

class TopNavigationAccount extends React.PureComponent<Props> {
    wrapperRefCallback = (element: ?HTMLElement) => {
        this.wrapper = element;
    }

    wrapper: ?HTMLElement;

    render() {
        const { state, pathname } = this.props.location;
        if (!state) return null;

        const basePath = `/device/${state.device}/network/${state.network}/account/${state.account}`;
        return (
            <Wrapper className="account-tabs" innerRef={this.wrapperRefCallback}>
                <StyledNavLink exact to={`${basePath}`}>Summary</StyledNavLink>
                <StyledNavLink to={`${basePath}/receive`}>Receive</StyledNavLink>
                <StyledNavLink to={`${basePath}/send`}>Send</StyledNavLink>
                <StyledNavLink to={`${basePath}/signverify`}>Sign &amp; Verify</StyledNavLink>
                <Indicator pathname={pathname} wrapper={() => this.wrapper} />
            </Wrapper>
        );
    }
}

export default TopNavigationAccount;