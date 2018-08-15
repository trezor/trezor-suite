import styled, { css } from 'styled-components';
import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

import AsideRow from './AsideRow';

import colors from 'config/colors';
import { FONT_SIZE, BORDER_WIDTH } from 'config/variables';

const Wrapper = styled.div`
    height: 64px;
    font-size: ${FONT_SIZE.SMALL};

    border-top: 1px solid ${colors.DIVIDER};
    span {
        font-size: ${FONT_SIZE.SMALLER};
        color: ${colors.TEXT_SECONDARY};
    }

    ${props => props.selected && css`
        border-left: ${BORDER_WIDTH.SELECTED} solid ${colors.GREEN_PRIMARY};
        background: ${colors.WHITE};

        &:hover {
            background-color: ${colors.WHITE};
        }

        &:last-child {
            border-bottom: 1px solid ${colors.DIVIDER};
        }
    `}
`;

const AsideRowAccount = ({ accountIndex, balance, url, selected }) => (
    <NavLink to={url}>
        <Wrapper
            to={url}
            selected={selected}
        >
            <AsideRow column>
                Account #{accountIndex + 1}
                {balance ? (
                    <span>{balance}</span>
                ) : (
                    <span>Loading...</span>
                )}
            </AsideRow>
        </Wrapper>
    </NavLink>
);

AsideRowAccount.propTypes = {
    accountIndex: PropTypes.number.isRequired,
    balance: PropTypes.string,
    url: PropTypes.string.isRequired,
    selected: PropTypes.bool,
};

AsideRowAccount.defaultProps = {
    selected: true,
};

export default AsideRowAccount;
