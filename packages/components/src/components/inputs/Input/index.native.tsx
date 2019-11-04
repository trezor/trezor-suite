import React from 'react';
import { TextInputProps } from 'react-native';
import styled, { css } from 'styled-components/native';

import { FONT_SIZE_NATIVE, FONT_WEIGHT, LINE_HEIGHT } from '../../../config/variables';
import { getStateIcon } from '../../../utils/icons';
import { getPrimaryColor } from '../../../utils/colors';
import { Icon } from '../../Icon';
import colors from '../../../config/colors';
import { FeedbackType, IconType } from '../../../support/types';

const Wrapper = styled.View<Props>`
    flex: 1;
`;

const InputWrapper = styled.View`
    flex: 1;
    flex-direction: row;
`;

const TopLabel = styled.Text`
    padding-bottom: 10px;
    color: ${colors.TEXT_SECONDARY};
`;

const StyledInput = styled.TextInput<Props>`
    width: 100%;
    height: ${props => (props.height ? props.height : 40)};
    padding: 0 ${props => (props.hasIcon ? '40px' : '12px')} 0 12px;

    font-size: ${props => (props.isSmallText ? FONT_SIZE_NATIVE.SMALL : FONT_SIZE_NATIVE.BASE)};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    color: ${props => (props.color ? props.color : colors.TEXT)};

    border-radius: 2px;
    
    ${props =>
        props.hasAddon &&
        css`
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
        `}

    border: 1px solid ${props => props.border};

    background-color: ${colors.WHITE};

    ${props =>
        props.tooltipAction &&
        css`
            z-index: 10001; /* bigger than modal container */
            position: relative;
        `};

    ${props =>
        !props.editable &&
        css`
            background-color: ${colors.GRAY_LIGHT};
            color: ${colors.TEXT_SECONDARY};
        `}
`;

const IconWrapper = styled.View`
    position: absolute;
    top: 12;
    right: 15;
    z-index: 10001;
`;

const BottomText = styled.Text<InputProps>`
    margin-top: 10px;
    font-size: ${FONT_SIZE_NATIVE.SMALL};
    color: ${props => (props.color ? props.color : colors.TEXT_SECONDARY)};
    z-index: 0;
`;

const Overlay = styled.View<InputProps>`
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

const TooltipAction = styled.View<TooltipActionProps>`
    display: ${props => (props.action ? 'flex' : 'none')};
    margin: 0px 10px;
    position: absolute;
    top: 5;
    background: black;
    height: 37;
    border-radius: 5px;
    z-index: 10009;
    transform: translate(-1px, -1px);
`;

const TooltipActionText = styled.Text`
    color: ${colors.WHITE};
    padding: 0 14px;
    height: 37;
    line-height: ${LINE_HEIGHT.TREZOR_ACTION};
`;

const ArrowUp = styled.View`
    position: absolute;
    top: -9;
    left: 12;
    width: 0;
    height: 0;
    background-color: transparent;
    border-style: solid;
    border-left-width: 9;
    border-right-width: 9;
    border-bottom-width: 9;
    border-left-color: transparent;
    border-right-color: transparent;
    border-bottom-color: black;
`;

interface TooltipActionProps {
    action?: React.ReactNode;
}

// TODO: tmp workaround for "Types of property 'accessibilityActions' are incompatible"
interface InputProps
    extends Omit<
        TextInputProps,
        | 'accessibilityActions'
        | 'accessibilityRole'
        | 'onAccessibilityAction'
        | 'accessibilityStates'
        | 'selectionState'
    > {
    hasIcon?: boolean;
    hasAddon?: boolean;
    isPartiallyHidden?: boolean;
    isSmallText?: boolean;
    border?: string;
    color?: string;
    tooltipAction?: React.ReactNode;
}

interface Props extends InputProps {
    innerRef?: any;
    height?: number;
    icon?: IconType;
    state?: FeedbackType;
    bottomText?: React.ReactNode;
    topLabel?: React.ReactNode;
    tooltipAction?: React.ReactNode;
    sideAddons?: React.ReactNode[];
    isDisabled?: boolean;
    isSmallText?: boolean;
    isPartiallyHidden?: boolean;
}

const Input = ({
    innerRef,
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
    ...rest
}: Props) => {
    const stateIcon = getStateIcon(state);
    const stateColor = getPrimaryColor(state) || undefined;

    return (
        <Wrapper>
            {topLabel && <TopLabel>{topLabel}</TopLabel>}
            <InputWrapper>
                <Overlay isPartiallyHidden={isPartiallyHidden} />
                <StyledInput
                    autoCompleteType="off"
                    height={height}
                    tooltipAction={tooltipAction}
                    hasIcon={!!icon || !!getStateIcon(state)}
                    ref={innerRef}
                    hasAddon={!!sideAddons}
                    color={stateColor}
                    isSmallText={isSmallText}
                    border={stateColor || colors.INPUT_BORDER}
                    editable={!isDisabled}
                    selectTextOnFocus={!isDisabled}
                    data-lpignore="true"
                    {...rest}
                />
                {stateIcon && stateColor && (
                    <IconWrapper>
                        <Icon icon={stateIcon} color={stateColor} size={16} />
                    </IconWrapper>
                )}
                {sideAddons && sideAddons.map(sideAddon => sideAddon)}
            </InputWrapper>
            <Wrapper>
                <TooltipAction action={tooltipAction}>
                    <ArrowUp />
                    <TooltipActionText>{tooltipAction}</TooltipActionText>
                </TooltipAction>
                {bottomText && <BottomText color={stateColor}>{bottomText}</BottomText>}
            </Wrapper>
        </Wrapper>
    );
};

export { Input, Props as InputProps };
