import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import colors from 'config/colors';
import { FONT_SIZE, FONT_WEIGHT } from 'config/variables';

const Wrapper = styled.div`
    width: 100%;
`;

const disabledColor = colors.TEXT_PRIMARY;

const TextArea = styled.textarea`
    width: 100%;
    padding: 5px 10px;
    box-sizing: border-box;
    min-height: 25px;
    border: ${props => (props.isError ? `1px solid ${colors.ERROR_PRIMARY}` : `1px solid ${colors.TEXT_PRIMARY}`)};
    resize: none;
    outline: none;
    background: transparent;
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

    &:hover:not(:disabled),
    &:focus:not(:disabled) {
        border: 1px solid ${colors.TEXT_SECONDARY};
    }
`;

const Textarea = ({
    className,
    placeholder = '',
    value = '',
    customStyle = {},
    onFocus,
    onBlur,
    disabled,
    onChange,
    isError,
}) => (
    <Wrapper>
        <TextArea
            className={className}
            disabled={disabled}
            style={customStyle}
            onFocus={onFocus}
            onBlur={onBlur}
            value={value}
            placeholder={placeholder}
            onChange={e => onChange(e.target.value)}
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
    disabled: PropTypes.bool,
};

export default Textarea;
