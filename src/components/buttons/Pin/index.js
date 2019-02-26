import React from 'react';

import PropTypes from 'prop-types';
import colors from 'config/colors';
import styled from 'styled-components';

const Wrapper = styled.button`
    width: 80px;
    height: 80px;
    margin-top: 15px;
    margin-left: 10px;
    border: 1px solid ${colors.DIVIDER};
    background: ${colors.WHITE};
    transition: all 0.3s;
    position: relative;

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

    &:before {
        width: 6px;
        height: 6px;
        content: ' ';
        position: absolute;
        border-radius: 100%;
        background: ${colors.TEXT_PRIMARY};
        margin-top: -3px;
        margin-left: -3px;
    }
`;

const ButtonPin = ({ onClick }) => (
    <Wrapper onClick={onClick} />
);

ButtonPin.propTypes = {
    onClick: PropTypes.func,
};

export default ButtonPin;