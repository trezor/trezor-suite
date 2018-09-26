import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import colors from 'config/colors';
import { FONT_SIZE, FONT_WEIGHT, FONT_FAMILY } from 'config/variables';

const Wrapper = styled.div`
   padding:
`;

const Textarea = ({
    className,
    placeholder = '',
    value,
    customStyle = {},
    onFocus,
    onBlur,
    isDisabled,
    onChange,
    isError,
    topLabel,
}) => (
    <Wrapper>
        {topLabel && (
            <TopLabel>{topLabel}</TopLabel>
        )}
        <StyledTextarea
            className={className}
            disabled={isDisabled}
            style={customStyle}
            onFocus={onFocus}
            onBlur={onBlur}
            value={value}
            placeholder={placeholder}
            onChange={onChange}
            isError={isError}
        />
    </Wrapper>
);

Textarea.propTypes = {
    className: PropTypes.string,
    isError: PropTypes.bool,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    customStyle: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    isDisabled: PropTypes.bool,
    topLabel: PropTypes.node,
};

export default Textarea;
