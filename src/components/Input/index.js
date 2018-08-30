import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import colors from 'config/colors';
import { FONT_SIZE, FONT_WEIGHT, TRANSITION } from 'config/variables';

const StyledInput = styled.input`
    padding: 6px 12px;

    line-height: 1.42857143;
    font-size: ${FONT_SIZE.SMALL};
    font-weight: ${FONT_WEIGHT.SMALLEST};
    color: ${colors.TEXT_PRIMARY};

    border-radius: 2px;
    border: 1px solid ${colors.DIVIDER};

    background-color: ${colors.WHITE};
    &:focus {
        box-shadow: 0 1px 2px 0 rgba(169, 169, 169, 0.25);
    }

    ${props => props.isValid && css`
        border-color: ${colors.SUCCESS_PRIMARY};
        &:focus {
            box-shadow: 0 1px 4px 0 rgba(1, 183, 87, 0.25);
        }
    `}
    ${props => props.isWarning && css`
        border-color: ${colors.WARNING_PRIMARY};
        &:focus {
            box-shadow: 0 1px 4px 0 rgba(235, 138, 0, 0.25);
        }
    `}
    ${props => props.isError && css`
        border-color: ${colors.ERROR_PRIMARY};
        &:focus {
            box-shadow: 0 1px 4px 0 rgba(255, 111, 109, 0.25);
        }
    `}

    transition: ${TRANSITION.HOVER};
    &:disabled {
        background: ${colors.GRAY_LIGHT};
        color: ${colors.TEXT_SECONDARY};
    }
`;

const Input = ({
    type, autoComplete, autoCorrect, autoCapitalize, spellCheck, value, onChange, isValid, isWarning, isError,
}) => (
    <StyledInput
        type={type}
        autoComplete={autoComplete}
        autoCorrect={autoCorrect}
        autoCapitalize={autoCapitalize}
        spellCheck={spellCheck}
        value={value}
        onChange={onChange}
        isValid={isValid}
        isWarning={isWarning}
        isError={isError}
    />
);

Input.propTypes = {
    type: PropTypes.string,
    autoComplete: PropTypes.string,
    autoCorrect: PropTypes.string,
    autoCapitalize: PropTypes.string,
    spellCheck: PropTypes.string,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    isValid: PropTypes.bool,
    isWarning: PropTypes.bool,
    isError: PropTypes.bool,
};

export default Input;
