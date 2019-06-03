import PropTypes from 'prop-types';
import styled, { css } from 'styled-components/native';
import React from 'react';
import { TextInputProps } from 'react-native';

import { FONT_FAMILY, FONT_SIZE_NATIVE as FONT_SIZE, FONT_WEIGHT } from '../../config/variables';
import { getPrimaryColor } from '../../utils/colors';
import colors from '../../config/colors';
import { FeedbackState } from '../../support/types';

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

interface StyledTextareaProps extends TextInputProps {
    border?: string;
    disabled?: boolean;
}

// TODO: proper types for wrapperProps (should be same as React.HTMLAttributes<HTMLDivElement>)
interface Props extends StyledTextareaProps, FeedbackState {
    isDisabled?: boolean;
    topLabel?: React.ReactNode;
    bottomText?: React.ReactNode;
    wrapperProps?: Record<string, any>;
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

TextArea.propTypes = {
    className: PropTypes.string,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    readOnly: PropTypes.bool,
    maxRows: PropTypes.number,
    maxLength: PropTypes.string,
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
