import colors from 'config/colors';
import { FONT_SIZE, BORDER_WIDTH } from 'config/variables';
import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';
import styled, { css } from 'styled-components';

import AsideRow from '../AsideRow';

const Wrapper = styled.div`
    height: 64px;

    font-size: ${FONT_SIZE.SMALL};
    color: ${colors.TEXT_PRIMARY};

    border-top: 1px solid ${colors.DIVIDER};
    span {
        font-size: ${FONT_SIZE.SMALLER};
        color: ${colors.TEXT_SECONDARY};
    }

    ${props => props.isSelected && css`
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

const AsideRowAccount = ({
    accountIndex, balance, url, isSelected = false,
}) => (
    <NavLink to={url}>
        <Wrapper
            to={url}
            isSelected={isSelected}
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
    url: PropTypes.string.isRequired,
    balance: PropTypes.string,
    isSelected: PropTypes.bool,
};

export default AsideRowAccount;
