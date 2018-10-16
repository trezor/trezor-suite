import React from 'react';
import Textarea from 'react-textarea-autosize';
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

const disabledColor = colors.TEXT_PRIMARY;

const StyledTextarea = styled(Textarea)`
    width: 100%;
    min-height: 85px;
    margin-bottom: 10px;
    padding: 10px 12px;
    box-sizing: border-box;
    border: 1px solid ${props => (props.borderColor ? props.borderColor : colors.DIVIDER)};
    border-radius: 2px;
    resize: none;
    outline: none;
    font-family: ${FONT_FAMILY.MONOSPACE};
    color: ${colors.TEXT_PRIMARY};
    background: ${colors.WHITE};
    font-weight: ${FONT_WEIGHT.BASE};
    font-size: ${FONT_SIZE.SMALL};
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
        pointer-events: none;
        background: ${colors.GRAY_LIGHT};
        color: ${colors.TEXT_SECONDARY};

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

const BottomText = styled.span`
    font-size: ${FONT_SIZE.SMALLER};
    color: ${props => (props.color ? props.color : colors.TEXT_SECONDARY)};
`;

const getColor = (inputState) => {
    let color = '';
    if (inputState === 'success') {
        color = colors.SUCCESS_PRIMARY;
    } else if (inputState === 'warning') {
        color = colors.WARNING_PRIMARY;
    } else if (inputState === 'error') {
        color = colors.ERROR_PRIMARY;
    }
    return color;
};

const TextArea = ({
    className,
    placeholder = '',
    value,
    customStyle = {},
    onFocus,
    onBlur,
    isDisabled,
    name,
    onChange,
    topLabel,
    state = '',
    bottomText = '',
}) => (
    <Wrapper
        className={className}
    >
        {topLabel && (
            <TopLabel>{topLabel}</TopLabel>
        )}
        <StyledTextarea
            className={className}
            disabled={isDisabled}
            name={name}
            style={customStyle}
            onFocus={onFocus}
            onBlur={onBlur}
            value={value}
            placeholder={placeholder}
            onChange={onChange}
            borderColor={getColor(state)}
        />
        {bottomText && (
            <BottomText
                color={getColor(state)}
            >
                {bottomText}
            </BottomText>
        )}
    </Wrapper>
);

TextArea.propTypes = {
    className: PropTypes.string,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    customStyle: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    name: PropTypes.string,
    isDisabled: PropTypes.bool,
    topLabel: PropTypes.node,
    state: PropTypes.string,
    bottomText: PropTypes.string,
};

export default TextArea;
