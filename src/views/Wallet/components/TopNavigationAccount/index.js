/* @flow */

import styled from 'styled-components';
import React from 'react';
import { FONT_SIZE, FONT_WEIGHT, SCREEN_SIZE } from 'config/variables';
import { NavLink } from 'react-router-dom';
import { connect } from 'react-redux';
import colors from 'config/colors';
import type { State } from 'flowtype';

import Indicator from './components/Indicator';

type Props = {
    router: $ElementType<State, 'router'>,
    selectedAccount: $ElementType<State, 'selectedAccount'>,
};

const Wrapper = styled.div`
    position: relative;
    display: flex;
    height: 100%;
    flex: 1;
    align-items: center;
    padding: 0px 30px 0 35px;
    overflow-y: hidden;
    overflow-x: auto;

    @media screen and (max-width: ${SCREEN_SIZE.MD}) {
        justify-content: space-between;
    }

    @media screen and (max-width: ${SCREEN_SIZE.SM}) {
        padding: 0px 16px;
    }
`;

const StyledNavLink = styled(NavLink)`
    font-weight: ${FONT_WEIGHT.MEDIUM};
    font-size: ${FONT_SIZE.TOP_MENU};
    color: ${colors.TEXT_SECONDARY};
    margin: 0px 4px;
    padding: 20px 35px;
    white-space: nowrap;

    @media screen and (max-width: ${SCREEN_SIZE.MD}) {
        padding: 20px 10px;
    }

    @media screen and (max-width: ${SCREEN_SIZE.XS}) {
        font-size: ${FONT_SIZE.BASE};
        padding: 20px 10px;
    }

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
        const { state, pathname } = this.props.router.location;
        if (!state) return null;
        const { network } = this.props.selectedAccount;
        if (!network) return null;

        const basePath = `/device/${state.device}/network/${state.network}/account/${state.account}`;

        return (
            <Wrapper className="account-tabs" ref={this.wrapperRefCallback}>
                <StyledNavLink exact to={`${basePath}`}>Summary</StyledNavLink>
                <StyledNavLink to={`${basePath}/receive`}>Receive</StyledNavLink>
                <StyledNavLink to={`${basePath}/send`}>Send</StyledNavLink>
                {network.type === 'ethereum'
                    && <StyledNavLink to={`${basePath}/signverify`}>Sign &amp; Verify</StyledNavLink>
                }
                <Indicator pathname={pathname} wrapper={() => this.wrapper} />
            </Wrapper>
        );
    }
}

export default connect((state: State): Props => ({
    router: state.router,
    selectedAccount: state.selectedAccount,
}), null)(TopNavigationAccount);