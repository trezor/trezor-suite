import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import colors from 'config/colors';
import { FONT_SIZE, FONT_WEIGHT, FONT_FAMILY } from 'config/variables';

const Wrapper = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
`;

const Label = styled.span`
    padding-bottom: 4px;
    color: ${colors.TEXT_SECONDARY};
`;

const disabledColor = colors.TEXT_PRIMARY;

const TextArea = styled.textarea`
    width: 100%;
    padding: 6px 12px;
    box-sizing: border-box;
    min-height: 25px;
    border: ${props => (props.isError ? `1px solid ${colors.ERROR_PRIMARY}` : `1px solid ${colors.DIVIDER}`)};
    border-radius: 2px;
    resize: none;
    outline: none;
    font-family: ${FONT_FAMILY.MONOSPACE};
    color: ${colors.TEXT_PRIMARY};
    background: ${colors.WHITE};
    font-weight: ${FONT_WEIGHT.BASE};
    font-size: ${FONT_SIZE.BASE};
    white-space: pre-wrap;       /* css-3 */
    white-space: -moz-pre-wrap;  /* Mozilla, since 1999 */
    white-space: -pre-wrap;      /* Opera 4-6 */
    white-space: -o-pre-wrap;    /* Opera 7 */
    word-wrap: break-word;       /* Internet Explorer 5.5+ */

    /* placeholder styles do not work correctly when groupped into one block */

    &::-webkit-input-placeholder {
        color: ${colors.LIGHT_GRAY_1};
        opacity: 1;
    }

    &::-moz-placeholder {
        color: ${colors.LIGHT_GRAY_1};
        opacity: 1;
    }

    &:-moz-placeholder {
        color: ${colors.LIGHT_GRAY_1};
        opacity: 1;
    }

    &:-ms-input-placeholder {
        color: ${colors.LIGHT_GRAY_1};
        opacity: 1;
    }

    &:disabled {
        border: 1px solid ${disabledColor};
        cursor: not-allowed;

        &::-webkit-input-placeholder {
            color: ${disabledColor};
            opacity: 1;
        }

        &::-moz-placeholder {
            color: ${disabledColor};
            opacity: 1;
        }

        &:-moz-placeholder {
            color: ${disabledColor};
            opacity: 1;
        }

        &:-ms-input-placeholder {
            color: ${disabledColor};
            opacity: 1;
        }
    }
`;

const TopLabel = styled.span`
    padding-bottom: 4px;
    color: ${colors.TEXT_SECONDARY};
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
        <TextArea
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
