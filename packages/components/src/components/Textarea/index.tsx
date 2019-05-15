import { FONT_FAMILY, FONT_SIZE, FONT_WEIGHT, LINE_HEIGHT } from '../../config/variables';
import styled, { css } from 'styled-components';
import { getPrimaryColor } from '../../utils/colors';

import PropTypes from 'prop-types';
import React from 'react';
import Textarea from 'react-textarea-autosize';
import colors from '../../config/colors';
import { Omit } from '../../support/types';

const Wrapper = styled.div`
    width: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
`;

const StyledTextarea = styled(Textarea)<StyledTextareaProps>`
    width: 100%;
    min-height: 85px;
    padding: 10px 12px;
    box-sizing: border-box;
    border: 1px solid ${props => props.border};
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
    }

    ${props =>
        props.tooltipAction &&
        css`
            z-index: 10001; /* bigger than modal container */
            pointer-events: none;
        `}
`;

const TopLabel = styled.span`
    padding-bottom: 10px;
    color: ${colors.TEXT_SECONDARY};
`;

const BottomText = styled.span`
    font-size: ${FONT_SIZE.SMALL};
    color: ${props => (props.color ? props.color : colors.TEXT_SECONDARY)};
    margin-top: 10px;
`;

const TooltipAction = styled.div<{ action: React.ReactNode }>`
    display: ${props => (props.action ? 'flex' : 'none')};
    align-items: center;
    margin: 0px 10px;
    padding: 0 14px;
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

type BaseTextareaProps = import('react-textarea-autosize').TextareaAutosizeProps;

interface StyledTextareaProps extends BaseTextareaProps {
    isSmallText?: boolean;
    border?: string;
    tooltipAction?: React.ReactNode;
}

// TODO: proper types for wrapperProps (should be same as React.HTMLAttributes<HTMLDivElement>)
interface Props extends BaseTextareaProps, StyledTextareaProps {
    isDisabled?: boolean;
    topLabel?: React.ReactNode;
    bottomText?: React.ReactNode;
    state: 'success' | 'info' | 'warning' | 'error';
    wrapperProps?: Object;
}

const TextArea = ({
    className,
    maxRows,
    maxLength,
    isDisabled,
    topLabel,
    state,
    bottomText,
    tooltipAction,
    wrapperProps,
    ...rest
}: Omit<Props, 'ref' | 'as'>) => {
    // TODO: figure out why 'ref' and 'as' prop need to be omitted
    const stateColor = getPrimaryColor(state) || undefined;
    return (
        <Wrapper className={className} {...wrapperProps}>
            {topLabel && <TopLabel>{topLabel}</TopLabel>}
            <StyledTextarea
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                maxLength={maxLength}
                disabled={isDisabled}
                border={stateColor || colors.INPUT_BORDER}
                {...rest}
            />
            <TooltipAction action={tooltipAction}>
                <ArrowUp />
                {tooltipAction}
            </TooltipAction>
            {bottomText && <BottomText color={stateColor}>{bottomText}</BottomText>}
        </Wrapper>
    );
};

TextArea.propTypes = {
    className: PropTypes.string,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    readOnly: PropTypes.bool,
    maxRows: PropTypes.number,
    maxLength: PropTypes.number,
    rows: PropTypes.number,
    name: PropTypes.string,
    isDisabled: PropTypes.bool,
    topLabel: PropTypes.node,
    state: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
    autoSelect: PropTypes.bool,
    bottomText: PropTypes.string,
    tooltipAction: PropTypes.node,
};

export default TextArea;
