import styled, { css } from 'styled-components';
import React from 'react';

import { getStateColor } from '../../../utils';
import { colors, variables } from '../../../config';
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
}

const StyledTextarea = styled.textarea<StyledTextareaProps>`
    width: ${props => (props.width ? `${props.width}px` : '100%')};
    padding: 10px;
    box-sizing: border-box;
    border: solid 2px
        ${props => (props.state ? getStateColor(props.state) : colors.NEUE_STROKE_GREY)};
    border-radius: 4px;
    resize: none;
    outline: none;
    font-family: ${variables.FONT_FAMILY.TTHOVES};
    color: ${props => getStateColor(props.state)};
    background: ${colors.WHITE};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    white-space: pre-wrap; /* css-3 */
    white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
    white-space: -pre-wrap; /* Opera 4-6 */
    white-space: -o-pre-wrap; /* Opera 7 */
    word-wrap: break-word; /* Internet Explorer 5.5+ */

    &:read-only {
        background: ${colors.BLACK96};
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
        props.monospace &&
        css`
            font-variant-numeric: slashed-zero tabular-nums;
        `}
`;

const BottomText = styled.span<StyledTextareaProps>`
    padding: 10px 10px 0 10px;
    min-height: 27px;
    font-size: ${variables.FONT_SIZE.TINY};
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

const Label = styled.label`
    display: flex;
    min-height: 32px;
    justify-content: space-between;
`;

const Left = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    padding: 0 0 12px 0;
    color: ${colors.NEUE_TYPE_DARK_GREY};
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
interface Props extends StyledTextareaProps {
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
}

const Textarea = ({
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
    ...rest
}: Props) => {
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
                {...rest}
            />
            <TooltipAction action={tooltipAction}>
                <ArrowUp />
                {tooltipAction}
            </TooltipAction>
            {!noError && <BottomText state={state}>{bottomText}</BottomText>}
        </Wrapper>
    );
};

export { Textarea, Props as TextareaProps };
