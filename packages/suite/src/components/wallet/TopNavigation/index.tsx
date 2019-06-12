import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { colors, variables } from '@trezor/components';
import { State } from '@suite/types';
import { getRoute } from '@suite-utils/router';
import { goto } from '@suite-actions/routerActions';

import l10nMessages from './index.messages';

const { FONT_WEIGHT, FONT_SIZE, SCREEN_SIZE } = variables;

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    align-items: center;
    overflow-y: hidden;
    overflow-x: auto;
    padding: 0px 30px 0 35px;
    height: 70px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06);
    background: ${colors.WHITE};
    position: relative;
    cursor: pointer;

    @media screen and (max-width: ${SCREEN_SIZE.MD}) {
        justify-content: space-between;
    }

    @media screen and (max-width: ${SCREEN_SIZE.SM}) {
        padding: 0px 16px;
    }
`;

const StyledNavLink = styled.div<{ active: boolean }>`
    font-weight: ${FONT_WEIGHT.MEDIUM};
    font-size: ${FONT_SIZE.TOP_MENU};
    color: ${colors.TEXT_SECONDARY};
    margin: 0px 4px;
    padding: 20px 35px;
    display: flex;
    height: 100%;
    white-space: nowrap;
    border-bottom: 2px solid ${props => (props.active ? colors.GREEN_PRIMARY : colors.WHITE)};

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
`;

const LinkContent = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    padding-top: 4px;
`;

interface Props {
    router: State['router'];
}

const TopNavigation = (props: Props) => {
    const { pathname } = props.router;
    const currentPath = pathname;

    const isPathActive = (path: string) => {
        return currentPath === getRoute(path);
    };
    return (
        <Wrapper>
            <StyledNavLink
                active={isPathActive('wallet-account-summary')}
                onClick={() => goto(getRoute('wallet-account-summary'), true)}
            >
                <LinkContent>
                    <FormattedMessage {...l10nMessages.TR_NAV_SUMMARY} />
                </LinkContent>
            </StyledNavLink>
            {/* {config.transactions && ( */}
            <StyledNavLink
                active={isPathActive('wallet-account-transactions')}
                onClick={() => goto(getRoute('wallet-account-transactions'), true)}
            >
                <LinkContent>
                    <FormattedMessage {...l10nMessages.TR_NAV_TRANSACTIONS} />
                </LinkContent>
            </StyledNavLink>
            {/* )} */}
            <StyledNavLink
                active={isPathActive('wallet-account-receive')}
                onClick={() => goto(getRoute('wallet-account-receive'), true)}
            >
                <LinkContent>
                    <FormattedMessage {...l10nMessages.TR_NAV_RECEIVE} />
                </LinkContent>
            </StyledNavLink>
            <StyledNavLink
                active={isPathActive('wallet-account-send')}
                onClick={() => goto(getRoute('wallet-account-send'), true)}
            >
                <LinkContent>
                    <FormattedMessage {...l10nMessages.TR_NAV_SEND} />
                </LinkContent>
            </StyledNavLink>
            {/* {networkConfig.hasSignVerify && ( */}
            <StyledNavLink
                active={isPathActive('wallet-account-sign-verify')}
                onClick={() => goto(getRoute('wallet-account-sign-verify'), true)}
            >
                <LinkContent>
                    <FormattedMessage {...l10nMessages.TR_NAV_SIGN_AND_VERIFY} />
                </LinkContent>
            </StyledNavLink>
            {/* )} */}
        </Wrapper>
    );
};

const mapStateToProps = (state: State) => ({
    router: state.router,
});

export default connect(mapStateToProps)(TopNavigation);
