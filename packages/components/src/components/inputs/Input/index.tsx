import React from 'react';
import styled, { css } from 'styled-components';
import PropTypes from 'prop-types';

import { Tooltip } from 'src';
import {
    FONT_FAMILY,
    FONT_SIZE,
    FONT_WEIGHT,
    LINE_HEIGHT,
    TRANSITION,
} from '../../../config/variables';
import { getStateIcon } from '../../../utils/icons';
import { getPrimaryColor } from '../../../utils/colors';
import Icon from '../../Icon';
import colors from '../../../config/colors';
import { FeedbackType } from '../../../support/types';

const Wrapper = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
`;

const InputWrapper = styled.div`
    display: flex;
`;

const InputIconWrapper = styled.div`
    flex: 1;
    position: relative;
    display: inline-block;
    background: white;
`;

const TopLabel = styled.span`
    padding-bottom: 10px;
    color: ${colors.TEXT_SECONDARY};
`;

const StyledInput = styled.input<InputProps>`
    width: 100%;
    height: ${props => (props.height ? `${props.height}px` : '40px')};
    padding: 5px ${props => (props.hasIcon ? '40px' : '12px')} 6px 12px;

    font-family: ${FONT_FAMILY.MONOSPACE};
    line-height: ${LINE_HEIGHT.SMALL};
    font-size: ${props => (props.isSmallText ? `${FONT_SIZE.SMALL}` : `${FONT_SIZE.BASE}`)};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    color: ${props => (props.color ? props.color : colors.TEXT)};
    box-sizing: border-box;

    border-radius: 2px;
    
    ${props =>
        props.hasAddon &&
        css`
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
        `}

    border: 1px solid ${props => props.border};

    background-color: ${colors.WHITE};
    transition: ${TRANSITION.HOVER};

    &:disabled {
        pointer-events: none;
        background: ${colors.GRAY_LIGHT};
        color: ${colors.TEXT_SECONDARY};
    }

    &:read-only  {
        background: ${colors.GRAY_LIGHT};
        color: ${colors.TEXT_SECONDARY};
    }

    &:focus {
        box-shadow: ${colors.INPUT_FOCUS_SHADOW} 0px 0px 6px 0px;
        border-color: ${props => props.border || colors.INPUT_FOCUS_BORDER};
        outline: none;
    }

    ${props =>
        props.tooltipAction &&
        css`
            z-index: 10001; /* bigger than modal container */
            position: relative;
        `};
`;

const StyledIcon = styled(Icon)`
    position: absolute;
    left: auto;
    top: 12px;
    right: 15px;
`;

const BottomText = styled.span`
    margin-top: 10px;
    font-size: ${FONT_SIZE.SMALL};
    color: ${props => (props.color ? props.color : colors.TEXT_SECONDARY)};
`;

const Overlay = styled.div<InputProps>`
    ${props =>
        props.isPartiallyHidden &&
        css`
            bottom: 0;
            border: 1px solid ${colors.DIVIDER};
            border-radius: 2px;
            position: absolute;
            width: 100%;
            height: 100%;
            background-image: linear-gradient(
                to right,
                rgba(0, 0, 0, 0) 0%,
                rgba(249, 249, 249, 1) 220px
            );
        `}
`;

const TooltipAction = styled.div<TooltipActionProps>`
    display: ${props => (props.action ? 'flex' : 'none')};
    align-items: center;
    height: 37px;
    margin: 0px 10px;
    padding: 0 14px;
    position: absolute;
    top: 45px;
    background: black;
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

interface TooltipActionProps {
    action?: React.ReactNode;
}

interface InputProps {
    hasIcon?: boolean;
    hasAddon?: boolean;
    isPartiallyHidden?: boolean;
    isSmallText?: boolean;
    border?: string;
    tooltipAction?: React.ReactNode;
}

// TODO: proper types for wrapperProps (should be same as React.HTMLAttributes<HTMLDivElement>)
interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
    innerRef?: any;
    height?: number;
    icon?: any;
    bottomText?: React.ReactNode;
    topLabel?: React.ReactNode;
    tooltipAction?: React.ReactNode;
    sideAddons?: React.ReactNode[];
    isDisabled?: boolean;
    isSmallText?: boolean;
    isPartiallyHidden?: boolean;
    wrapperProps?: Record<string, any>;
    type?: string; // TODO: type prop should be inherited from basic html input
    propTypes?: any;
    state?: FeedbackType;
}

const Input = ({
    className,
    innerRef,
    type = 'text',
    height = 40,
    icon,
    state,
    bottomText,
    topLabel,
    tooltipAction,
    sideAddons,
    isDisabled,
    isSmallText,
    isPartiallyHidden,
    wrapperProps,
    ...rest
}: Props) => {
    const stateIcon = getStateIcon(state);
    const stateColor = getPrimaryColor(state) || undefined;

    return (
        <Wrapper className={className} {...wrapperProps}>
            {topLabel && <TopLabel>{topLabel}</TopLabel>}
            <InputWrapper>
                <InputIconWrapper>
                    {stateIcon && stateColor && (
                        <StyledIcon icon={stateIcon} color={stateColor} size={16} />
                    )}
                    <Overlay isPartiallyHidden={isPartiallyHidden} />
                    {/* TODO: this icon should be most likely removed */}
                    {icon}
                    <StyledInput
                        type={type}
                        autoComplete="off"
                        height={height}
                        tooltipAction={tooltipAction}
                        hasIcon={icon || getStateIcon(state)}
                        ref={innerRef}
                        hasAddon={!!sideAddons}
                        color={stateColor}
                        isSmallText={isSmallText}
                        border={stateColor || colors.INPUT_BORDER}
                        disabled={isDisabled}
                        data-lpignore="true"
                        {...rest}
                    />
                    <TooltipAction action={tooltipAction}>
                        <ArrowUp />
                        {tooltipAction}
                    </TooltipAction>
                </InputIconWrapper>
                {sideAddons && sideAddons.map(sideAddon => sideAddon)}
            </InputWrapper>
            {bottomText && <BottomText color={stateColor}>{bottomText}</BottomText>}
        </Wrapper>
    );
};

Input.propTypes = {
    className: PropTypes.string,
    innerRef: PropTypes.func,
    placeholder: PropTypes.string,
    type: PropTypes.string,
    height: PropTypes.number,
    autocorrect: PropTypes.string,
    autocapitalize: PropTypes.string,
    icon: PropTypes.node,
    spellCheck: PropTypes.string,
    value: PropTypes.string,
    readOnly: PropTypes.bool,
    onChange: PropTypes.func,
    state: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
    bottomText: PropTypes.node,
    topLabel: PropTypes.node,
    tooltipAction: PropTypes.node,
    sideAddons: PropTypes.arrayOf(PropTypes.node),
    isDisabled: PropTypes.bool,
    name: PropTypes.string,
    isSmallText: PropTypes.bool,
    isPartiallyHidden: PropTypes.bool,
};

export default Input;
