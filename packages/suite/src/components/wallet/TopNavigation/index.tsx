import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { colors, variables } from '@trezor/components';
import { State } from '@suite/types';
import { getRoute } from '@suite-utils/router';
import { goto } from '@suite-actions/routerActions';
import NETWORKS from '@suite-config/networks';
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
    const { pathname, params } = props.router;
    const currentPath = pathname;

    const accountNavigation = [
        {
            route: getRoute('wallet-account-summary'),
            title: <FormattedMessage {...l10nMessages.TR_NAV_SUMMARY} />,
        },
        {
            route: getRoute('wallet-account-transactions'),
            title: <FormattedMessage {...l10nMessages.TR_NAV_TRANSACTIONS} />,
        },
        {
            route: getRoute('wallet-account-receive'),
            title: <FormattedMessage {...l10nMessages.TR_NAV_RECEIVE} />,
        },
        {
            route: getRoute('wallet-account-send'),
            title: <FormattedMessage {...l10nMessages.TR_NAV_SEND} />,
        },
        {
            route: getRoute('wallet-account-sign-verify'),
            title: <FormattedMessage {...l10nMessages.TR_NAV_SIGN_AND_VERIFY} />,
            isHidden: (coinShortcut: string) => {
                const network = NETWORKS.find(c => c.shortcut === coinShortcut);
                return network && !network.hasSignVerify;
            },
        },
    ];

    return (
        <Wrapper>
            {accountNavigation.map(item => {
                // show item if isHidden() returns false or when isHidden func is not defined
                if ((item.isHidden && !item.isHidden(params.coin)) || !item.isHidden) {
                    return (
                        <StyledNavLink
                            active={currentPath === item.route}
                            onClick={() => goto(item.route, true)}
                        >
                            <LinkContent>{item.title}</LinkContent>
                        </StyledNavLink>
                    );
                }
                return null;
            })}
        </Wrapper>
    );
};

const mapStateToProps = (state: State) => ({
    router: state.router,
});

export default connect(mapStateToProps)(TopNavigation);
