/* @flow */

import styled from 'styled-components';
import React from 'react';
import { FONT_SIZE, FONT_WEIGHT, SCREEN_SIZE } from 'config/variables';
import { NavLink } from 'react-router-dom';
import { connect } from 'react-redux';
import { colors } from 'trezor-ui-components';
import type { State } from 'flowtype';
import { FormattedMessage } from 'react-intl';

import l10nMessages from './index.messages';

type OwnProps = {||};

type StateProps = {|
    router: $ElementType<State, 'router'>,
    selectedAccount: $ElementType<State, 'selectedAccount'>,
    localStorage: $ElementType<State, 'localStorage'>,
|};

type Props = {| ...OwnProps, ...StateProps |};

type LocalState = {
    wrapper: ?HTMLElement,
};

const Wrapper = styled.div`
    display: flex;
    height: 100%;
    flex: 1;
    align-items: center;
    overflow-y: hidden;
    overflow-x: auto;
    padding: 0px 30px 0 35px;

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
    display: flex;
    height: 100%;
    white-space: nowrap;
    border-bottom: 2px solid ${colors.WHITE};

    @media screen and (max-width: ${SCREEN_SIZE.MD}) {
        padding: 20px 10px;
    }

    @media screen and (max-width: ${SCREEN_SIZE.XS}) {
        font-size: ${FONT_SIZE.BASE};
        padding: 20px 10px;
    }

    &.active,
    &:hover {
        color: ${colors.TEXT_PRIMARY};
    }

    &:first-child {
        margin-left: 0px;
    }

    &:last-child {
        margin-right: 0px;
    }

    &.has-bottom-border {
        border-bottom: 2px solid ${colors.GREEN_PRIMARY};
    }
`;

const LinkContent = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    padding-top: 4px;
`;

class TopNavigationAccount extends React.PureComponent<Props, LocalState> {
    render() {
        const { config } = this.props.localStorage;
        const { state } = this.props.router.location;
        if (!state) return null;
        const { network } = this.props.selectedAccount;
        if (!network) return null;
        const networkConfig = config.networks.find(c => c.shortcut === network.shortcut);
        if (!networkConfig) return null;

        const basePath = `/device/${state.device}/network/${state.network}/account/${
            state.account
        }`;

        return (
            <Wrapper>
                <StyledNavLink activeClassName="has-bottom-border" exact to={`${basePath}`}>
                    <LinkContent>
                        <FormattedMessage {...l10nMessages.TR_NAV_SUMMARY} />
                    </LinkContent>
                </StyledNavLink>
                <StyledNavLink activeClassName="has-bottom-border" to={`${basePath}/receive`}>
                    <LinkContent>
                        <FormattedMessage {...l10nMessages.TR_NAV_RECEIVE} />
                    </LinkContent>
                </StyledNavLink>
                <StyledNavLink activeClassName="has-bottom-border" to={`${basePath}/send`}>
                    <LinkContent>
                        <FormattedMessage {...l10nMessages.TR_NAV_SEND} />
                    </LinkContent>
                </StyledNavLink>
                {networkConfig.hasSignVerify && (
                    <StyledNavLink
                        activeClassName="has-bottom-border"
                        to={`${basePath}/signverify`}
                    >
                        <LinkContent>
                            <FormattedMessage {...l10nMessages.TR_NAV_SIGN_AND_VERIFY} />
                        </LinkContent>
                    </StyledNavLink>
                )}
            </Wrapper>
        );
    }
}

export default connect<Props, OwnProps, StateProps, _, State, _>(
    (state: State): StateProps => ({
        router: state.router,
        selectedAccount: state.selectedAccount,
        localStorage: state.localStorage,
    }),
    null
)(TopNavigationAccount);
