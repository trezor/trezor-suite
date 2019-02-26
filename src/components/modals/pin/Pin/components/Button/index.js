/* @flow */

import * as React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import colors from 'config/colors';
import { FONT_SIZE, FONT_WEIGHT, SCREEN_SIZE } from 'config/variables';

type Props = {
    onClick: () => void;
    children: React.Node;
};

const Wrapper = styled.button`
    width: 80px;
    height: 80px;
    margin-top: 15px;
    margin-left: 10px;
    font-size: ${FONT_SIZE.BIGGER};
    font-weight: ${FONT_WEIGHT.SEMIBOLD};
    color: ${colors.TEXT_PRIMARY};
    border: 1px solid ${colors.DIVIDER};
    background: ${colors.WHITE};
    transition: all 0.3s;
    cursor: pointer;

    @media screen and (max-width: ${SCREEN_SIZE.XS}) {
        width: 50px;
        height: 50px;
    }

    &:first-child {
        margin-left: 0px;
    }

    &:hover {
        color: ${colors.TEXT_PRIMARY};
        background-color: ${colors.WHITE};
        border-color: ${colors.TEXT_SECONDARY};
    }

    &:active {
        color: ${colors.TEXT_PRIMARY};
        background: ${colors.DIVIDER};
        border-color: ${colors.DIVIDER};
    }
`;

const PinButton = ({ children, onClick }: Props) => (
    <Wrapper onClick={onClick}>
        { children }
    </Wrapper>
);

PinButton.propTypes = {
    children: PropTypes.string.isRequired,
    onClick: PropTypes.func,
};

export default PinButton;