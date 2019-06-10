import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { colors, variables } from '@trezor/components';
import { State } from '@suite/types';
import { getRoute } from '@suite/utils/router';
import { goto } from '@suite-actions/routerActions';

import l10nMessages from './index.messages';

const { FONT_WEIGHT, FONT_SIZE, SCREEN_SIZE } = variables;

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

const StyledNavLink = styled.div`
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

const Navigation = styled.nav`
    height: 70px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06);
    display: flex;
    background: ${colors.WHITE};
    position: relative;
`;

interface Props {
    suite: State['suite'];
    router: State['router'];
}

const Wallet = (props: Props) => {
    const { pathname, params } = props.router;
    const baseUrl = `${pathname}#/${params.coin}/`;
    return (
        <Navigation>
            <Wrapper>
                <StyledNavLink onClick={() => goto(getRoute('wallet-account-summary'), true)}>
                    <LinkContent>
                        <FormattedMessage {...l10nMessages.TR_NAV_SUMMARY} />
                    </LinkContent>
                </StyledNavLink>
                {/* {config.transactions && ( */}
                <StyledNavLink onClick={() => goto(getRoute('wallet-account-transactions'), true)}>
                    <LinkContent>
                        <FormattedMessage {...l10nMessages.TR_NAV_TRANSACTIONS} />
                    </LinkContent>
                </StyledNavLink>
                {/* )} */}
                <StyledNavLink onClick={() => goto(getRoute('wallet-account-receive'), true)}>
                    <LinkContent>
                        <FormattedMessage {...l10nMessages.TR_NAV_RECEIVE} />
                    </LinkContent>
                </StyledNavLink>
                <StyledNavLink onClick={() => goto(getRoute('wallet-account-send'), true)}>
                    <LinkContent>
                        <FormattedMessage {...l10nMessages.TR_NAV_SEND} />
                    </LinkContent>
                </StyledNavLink>
                {/* {networkConfig.hasSignVerify && ( */}
                <StyledNavLink onClick={() => goto(getRoute('wallet-account-sign-verify'), true)}>
                    <LinkContent>
                        <FormattedMessage {...l10nMessages.TR_NAV_SIGN_AND_VERIFY} />
                    </LinkContent>
                </StyledNavLink>
                {/* )} */}
            </Wrapper>
        </Navigation>
    );
};

const mapStateToProps = (state: State) => ({
    suite: state.suite,
    router: state.router,
});

export default connect(mapStateToProps)(Wallet);
