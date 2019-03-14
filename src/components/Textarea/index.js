import { FONT_FAMILY, FONT_SIZE, FONT_WEIGHT, LINE_HEIGHT } from 'config/variables';
import styled, { css } from 'styled-components';

import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Textarea from 'react-textarea-autosize';
import colors from 'config/colors';
import ICONS from 'config/icons';
import Icon from 'components/Icon';

const Wrapper = styled.div`
    width: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
`;

const disabledColor = colors.TEXT_PRIMARY;

const TextAreaWrapper = styled.div`
    position: relative;
`;

const StyledTextarea = styled(Textarea)`
    width: 100%;
    min-height: 85px;
    padding: 10px 12px;
    box-sizing: border-box;
    border: 1px solid ${props => props.border || colors.INPUT_BORDER};
    border-radius: 2px;
    resize: none;
    outline: none;
    font-family: ${FONT_FAMILY.MONOSPACE};
    color: ${colors.TEXT_PRIMARY};
    background: ${colors.WHITE};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    font-size: ${FONT_SIZE.BASE};
    white-space: pre-wrap; /* css-3 */
    white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
    white-space: -pre-wrap; /* Opera 4-6 */
    white-space: -o-pre-wrap; /* Opera 7 */
    word-wrap: break-word; /* Internet Explorer 5.5+ */

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

    &:focus {
        box-shadow: ${colors.INPUT_FOCUS_SHADOW} 0px 0px 6px 0px;
        border-color: ${props => props.border || colors.INPUT_FOCUS_BORDER};
        outline: none;
    }

    &:read-only {
        background: ${colors.GRAY_LIGHT};
        color: ${colors.TEXT_SECONDARY};
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

    ${props =>
        props.trezorAction &&
        css`
            z-index: 10001; /* bigger than modal container */
            border-color: ${colors.WHITE};
            border-width: 2px;
            transform: translate(-1px, -1px);
            background: ${colors.DIVIDER};
            pointer-events: none;
        `}
`;

const TopLabel = styled.span`
    padding-bottom: 10px;
    color: ${colors.TEXT_SECONDARY};
`;

const BottomText = styled.span`
    font-size: ${FONT_SIZE.SMALL};
    color: ${props => props.color || colors.TEXT_SECONDARY};
    margin-top: 10px;
`;

const TrezorAction = styled.div`
    display: ${props => (props.action ? 'flex' : 'none')};
    align-items: center;
    margin: 0px 10px;
    padding: 0 14px 0 5px;
    position: absolute;
    background: black;
    bottom: -25px;
    color: ${colors.WHITE};
    border-radius: 5px;
    line-height: ${LINE_HEIGHT.TREZOR_ACTION};
    z-index: 10002;
    transform: translate(-1px, -1px);
`;

const ArrowUp = styled.div`
    position: absolute;
    top: -9px;
    left: 12px;
    width: 0;
    height: 0;
    border-left: 9px solid transparent;
    border-right: 9px solid transparent;
    border-bottom: 9px solid black;
    z-index: 10001;
`;

const StyledIcon = styled(Icon)`
    position: absolute;
    top: 12px;
    right: 15px;
`;

class TextArea extends PureComponent {
    getIcon(inputState) {
        let icon = [];
        if (inputState === 'success') {
            icon = ICONS.SUCCESS;
        } else if (inputState === 'warning') {
            icon = ICONS.WARNING;
        } else if (inputState === 'error') {
            icon = ICONS.ERROR;
        }
        return icon;
    }

    getColor(inputState) {
        let color = '';
        if (inputState === 'success') {
            color = colors.SUCCESS_PRIMARY;
        } else if (inputState === 'warning') {
            color = colors.WARNING_PRIMARY;
        } else if (inputState === 'error') {
            color = colors.ERROR_PRIMARY;
        }
        return color;
    }

    render() {
        return (
            <Wrapper className={this.props.className}>
                {this.props.topLabel && <TopLabel>{this.props.topLabel}</TopLabel>}
                <TextAreaWrapper>
                    {this.props.state && (
                        <StyledIcon
                            icon={this.getIcon(this.props.state)}
                            color={this.getColor(this.props.state)}
                            size={16}
                        />
                    )}
                    <StyledTextarea
                        spellCheck="false"
                        autoCorrect="off"
                        autoCapitalize="off"
                        maxRows={this.props.maxRows}
                        maxLength={this.props.maxLength}
                        rows={this.props.rows}
                        className={this.props.className}
                        disabled={this.props.isDisabled}
                        name={this.props.name}
                        style={this.props.customStyle}
                        onFocus={this.props.onFocus}
                        onBlur={this.props.onBlur}
                        value={this.props.value}
                        readOnly={this.props.readOnly}
                        onClick={this.props.autoSelect ? event => event.target.select() : null}
                        placeholder={this.props.placeholder}
                        onChange={this.props.onChange}
                        border={this.getColor(this.props.state)}
                    />
                </TextAreaWrapper>
                <TrezorAction action={this.props.trezorAction}>
                    <ArrowUp />
                    {this.props.trezorAction}
                </TrezorAction>
                {this.props.bottomText && (
                    <BottomText color={this.getColor(this.props.state)}>
                        {this.props.bottomText}
                    </BottomText>
                )}
            </Wrapper>
        );
    }
}

TextArea.propTypes = {
    className: PropTypes.string,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    customStyle: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    readOnly: PropTypes.bool,
    maxRows: PropTypes.number,
    maxLength: PropTypes.number,
    rows: PropTypes.number,
    name: PropTypes.string,
    isDisabled: PropTypes.bool,
    topLabel: PropTypes.node,
    state: PropTypes.oneOf(['success', 'warning', 'error']),
    autoSelect: PropTypes.bool,
    bottomText: PropTypes.string,
    trezorAction: PropTypes.node,
};

export default TextArea;
