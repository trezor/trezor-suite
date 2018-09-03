import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import colors from 'config/colors';

const Wrapper = styled.button`
    width: 80px;
    height: 80px;
    margin-top: 15px;
    margin-left: 10px;
    font-size: 22px;
    font-weight: 600;
    color: ${colors.TEXT_PRIMARY};
    border: 1px solid ${colors.DIVIDER};
    background: ${colors.WHITE};
    transition: all 0.3s;

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

const PinButton = ({
    children, className, onClick,
}) => (
    <Wrapper
        className={className}
        onClick={onClick}
    >
        {children}
    </Wrapper>
);

PinButton.propTypes = {
    className: PropTypes.string,
    children: PropTypes.string.isRequired,
    onClick: PropTypes.func,
};

export default PinButton;