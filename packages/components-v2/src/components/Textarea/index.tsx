import styled, { css } from 'styled-components';
import React from 'react';

import { getStateColor, getDisplayWidth } from '../../utils';
import { colors, variables } from '../../config';
import { InputState, InputDisplay } from '../../support/types';

const Wrapper = styled.div`
    width: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
`;

const StyledTextarea = styled.textarea<StyledTextareaProps>`
    width: ${props => getDisplayWidth(props.display || 'default')};
    padding: 10px;
    box-sizing: border-box;
    border: solid 1px ${props => (props.state ? getStateColor(props.state) : colors.BLACK80)};
    border-radius: 3px;
    box-shadow: inset 0 3px 6px 0 ${colors.BLACK92};
    resize: none;
    outline: none;
    font-family: ${variables.FONT_FAMILY.TTHOVES};
    color: ${props => getStateColor(props.state)};
    background: ${colors.WHITE};
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
    font-size: ${props => (props.value ? '16px' : '14px')};
    white-space: pre-wrap; /* css-3 */
    white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
    white-space: -pre-wrap; /* Opera 4-6 */
    white-space: -o-pre-wrap; /* Opera 7 */
    word-wrap: break-word; /* Internet Explorer 5.5+ */

    &:read-only {
        background: ${colors.BLACK96};
        box-shadow: none;
        color: ${colors.BLACK50};
    }

    ${props =>
        props.disabled &&
        css`
            background: ${colors.BLACK96};
            box-shadow: none;
            color: ${colors.BLACK50};
            cursor: not-allowed;
        `}

    ${props =>
        !props.disabled &&
        !props.state &&
        !props.readOnly &&
        css`
            &:hover,
            &:focus,
            &:active {
                border-color: ${colors.BLACK50};
            }
        `}
`;

const TopLabel = styled.label`
    padding: 10px;
`;

const BottomText = styled.span<StyledTextareaProps>`
    padding: 10px;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${props => getStateColor(props.state)};
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

type BaseTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

interface StyledTextareaProps extends BaseTextareaProps {
    isSmallText?: boolean;
    border?: string;
    tooltipAction?: React.ReactNode;
    display?: InputDisplay;
    state?: InputState;
}

// TODO: proper types for wrapperProps (should be same as React.HTMLAttributes<HTMLDivElement>)
interface Props extends StyledTextareaProps {
    isDisabled?: boolean;
    topLabel?: React.ReactNode;
    bottomText?: React.ReactNode;
    maxRows?: number;
    wrapperProps?: Record<string, any>;
}

const Textarea = ({
    className,
    maxLength,
    isDisabled,
    topLabel,
    state,
    bottomText,
    tooltipAction,
    wrapperProps,
    display,
    rows = 5,
    ...rest
}: Props) => {
    return (
        <Wrapper className={className} {...wrapperProps}>
            {topLabel && <TopLabel>{topLabel}</TopLabel>}
            <StyledTextarea
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                maxLength={maxLength}
                disabled={isDisabled}
                display={display}
                state={state}
                rows={rows}
                {...rest}
            />
            <TooltipAction action={tooltipAction}>
                <ArrowUp />
                {tooltipAction}
            </TooltipAction>
            {bottomText && <BottomText state={state}>{bottomText}</BottomText>}
        </Wrapper>
    );
};

export { Textarea };
