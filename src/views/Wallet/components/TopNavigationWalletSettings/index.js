import styled from 'styled-components';
import React from 'react';
import { FONT_SIZE, FONT_WEIGHT } from 'config/variables';
import { getPattern } from 'support/routes';

import { NavLink } from 'react-router-dom';

import colors from 'config/colors';

import { FormattedMessage } from 'react-intl';
import l10nCommonMessages from 'views/common.messages';

const Wrapper = styled.div`
    position: relative;
    display: flex;
    height: 100%;
    flex: 1;
    align-items: center;
    padding: 0px 30px 0 35px;
    overflow-y: hidden;
    overflow-x: auto;
`;

const StyledNavLink = styled(NavLink)`
    font-weight: ${FONT_WEIGHT.MEDIUM};
    font-size: ${FONT_SIZE.TOP_MENU};
    color: ${colors.TEXT_SECONDARY};
    margin: 0px 4px;
    padding: 20px 10px;
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

// TODO: make universal TopNavigation component
const TopNavigationWalletSettings = () => (
    <Wrapper>
        <StyledNavLink exact to={getPattern('wallet-settings')}>
            <FormattedMessage {...l10nCommonMessages.TR_APPLICATION_SETTINGS} />
        </StyledNavLink>
    </Wrapper>
);

export default TopNavigationWalletSettings;
