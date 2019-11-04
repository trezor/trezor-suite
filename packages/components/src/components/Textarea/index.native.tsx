import styled, { css } from 'styled-components/native';
import React from 'react';
import { TextInputProps } from 'react-native';

import { FONT_SIZE_NATIVE as FONT_SIZE, FONT_WEIGHT } from '../../config/variables';
import { getPrimaryColor } from '../../utils/colors';
import colors from '../../config/colors';
import { FeedbackType } from '../../support/types';

const Wrapper = styled.View`
    width: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
`;

const StyledTextarea = styled.TextInput<StyledTextareaProps>`
    width: 100%;
    min-height: 85px;
    padding: 10px 12px;
    border: 1px solid ${props => props.border};
    border-radius: 2px;
    color: ${colors.TEXT_PRIMARY};
    background: ${colors.WHITE};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    font-size: ${FONT_SIZE.BASE};

    ${props =>
        props.disabled &&
        css`
            background: ${colors.GRAY_LIGHT};
            color: ${colors.TEXT_SECONDARY};
        `}
`;

const TopLabel = styled.Text`
    padding-bottom: 10px;
    color: ${colors.TEXT_SECONDARY};
`;

const BottomText = styled.Text<{ color?: string }>`
    font-size: ${FONT_SIZE.SMALL};
    color: ${props => props.color};
    margin-top: 10px;
`;

// TODO: tmp workaround for "Types of property 'accessibilityActions' are incompatible"
interface StyledTextareaProps
    extends Omit<
        TextInputProps,
        | 'accessibilityActions'
        | 'accessibilityRole'
        | 'onAccessibilityAction'
        | 'accessibilityStates'
        | 'selectionState'
    > {
    border?: string;
    disabled?: boolean;
}

// TODO: proper types for wrapperProps (should be same as React.HTMLAttributes<HTMLDivElement>)
interface Props extends StyledTextareaProps {
    isDisabled?: boolean;
    topLabel?: React.ReactNode;
    bottomText?: React.ReactNode;
    wrapperProps?: Record<string, any>;
    state?: FeedbackType;
}

const TextArea = ({
    maxLength,
    topLabel,
    state,
    bottomText,
    isDisabled,
    wrapperProps,
    ...rest
}: Props) => {
    // TODO: figure out why 'ref' and 'as' prop need to be omitted
    const stateColor = getPrimaryColor(state);
    return (
        <Wrapper {...wrapperProps}>
            {topLabel && <TopLabel>{topLabel}</TopLabel>}
            <StyledTextarea
                spellCheck={false}
                autoCorrect={false}
                autoCapitalize="none"
                multiline
                numberOfLines={4}
                editable={!isDisabled}
                border={stateColor || colors.INPUT_BORDER}
                maxLength={maxLength}
                {...rest}
            />
            {bottomText && (
                <BottomText color={stateColor || colors.TEXT_SECONDARY}>{bottomText}</BottomText>
            )}
        </Wrapper>
    );
};

export { TextArea, Props as TextareaProps };
