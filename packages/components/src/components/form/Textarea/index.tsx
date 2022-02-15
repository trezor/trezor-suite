import styled, { css } from 'styled-components';
import React from 'react';

import { getStateColor } from '../../../utils';
import { variables } from '../../../config';
import { InputState } from '../../../support/types';

const Wrapper = styled.div`
    width: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
`;

interface StyledTextareaProps extends BaseTextareaProps {
    tooltipAction?: React.ReactNode;
    width?: any;
    state?: InputState;
    monospace?: boolean;
    borderWidth?: number;
    borderRadius?: number;
}

const StyledTextarea = styled.textarea<StyledTextareaProps>`
    width: ${props => (props.width ? `${props.width}px` : '100%')};
    padding: 14px 16px;
    box-sizing: border-box;
    border: solid ${props => props.borderWidth}px
        ${props =>
            props.state ? getStateColor(props.state, props.theme) : props.theme.STROKE_GREY};
    border-radius: ${props => props.borderRadius}px;
    resize: none;
    outline: none;
    font-family: ${variables.FONT_FAMILY.TTHOVES};
    color: ${props => getStateColor(props.state, props.theme)};
    background: ${props => props.theme.BG_WHITE};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    white-space: pre-wrap; /* css-3 */
    white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
    white-space: -pre-wrap; /* Opera 4-6 */
    white-space: -o-pre-wrap; /* Opera 7 */
    word-wrap: break-word; /* Internet Explorer 5.5+ */

    &:read-only {
        background: ${props => props.theme.BG_GREY};
        color: ${props => props.theme.TYPE_DARK_GREY};
    }

    ${props =>
        props.disabled &&
        css`
            background: ${props => props.theme.BG_GREY};
            box-shadow: none;
            color: ${props => props.theme.TYPE_DARK_GREY};
            cursor: not-allowed;
        `}

    ${props =>
        props.monospace &&
        css`
            font-variant-numeric: slashed-zero tabular-nums;
        `}
`;

const BottomText = styled.span<StyledTextareaProps>`
    padding: 10px 10px 0 10px;
    min-height: 27px;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${props => getStateColor(props.state, props.theme)};
`;

const TooltipAction = styled.div<{ action: React.ReactNode }>`
    display: ${props => (props.action ? 'flex' : 'none')};
    align-items: center;
    margin: 0px 10px;
    padding: 0 14px;
    position: absolute;
    background: black;
    bottom: -25px;
    color: ${props => props.theme.BG_WHITE};
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

const Label = styled.div`
    display: flex;
    min-height: 32px;
    justify-content: space-between;
`;

const Left = styled.label`
    display: block;
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    padding: 0 0 12px 0;
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const Right = styled.div`
    display: flex;
`;

const VisibleRightLabel = styled.div`
    padding-left: 5px;
`;

const LabelAddon = styled.div``;

type BaseTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

// TODO: proper types for wrapperProps (should be same as React.HTMLAttributes<HTMLDivElement>)
export interface TextareaProps extends StyledTextareaProps {
    isDisabled?: boolean;
    label?: React.ReactNode;
    labelAddon?: React.ReactNode;
    labelRight?: React.ReactNode;
    innerRef?: React.Ref<HTMLTextAreaElement>;
    bottomText?: React.ReactNode;
    maxRows?: number;
    wrapperProps?: Record<string, any>;
    monospace?: boolean;
    noTopLabel?: boolean;
    noError?: boolean;
    borderWidth?: number;
    borderRadius?: number;
}

const Textarea: React.FC<TextareaProps> = ({
    className,
    maxLength,
    labelAddon,
    isDisabled,
    innerRef,
    label,
    state,
    bottomText,
    tooltipAction,
    wrapperProps,
    width,
    rows = 5,
    monospace,
    noTopLabel,
    labelRight,
    noError,
    borderWidth = 2,
    borderRadius = 4,
    children,
    ...rest
}) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <Wrapper
            className={className}
            {...wrapperProps}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {!noTopLabel && (
                <Label>
                    <Left>{label}</Left>
                    <Right>
                        {isHovered && <LabelAddon>{labelAddon}</LabelAddon>}
                        {labelRight && <VisibleRightLabel>{labelRight}</VisibleRightLabel>}
                    </Right>
                </Label>
            )}
            <StyledTextarea
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                maxLength={maxLength}
                disabled={isDisabled}
                width={width}
                state={state}
                rows={rows}
                ref={innerRef}
                monospace={monospace}
                borderWidth={borderWidth}
                borderRadius={borderRadius}
                {...rest}
            />
            <TooltipAction action={tooltipAction}>
                <ArrowUp />
                {tooltipAction}
            </TooltipAction>
            {children}
            {!noError && <BottomText state={state}>{bottomText}</BottomText>}
        </Wrapper>
    );
};

export { Textarea };
