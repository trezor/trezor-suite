import styled from 'styled-components';
import { useState, Ref, ReactNode, TextareaHTMLAttributes } from 'react';
import { spacingsPx, Elevation } from '@trezor/theme';

import { InputState } from '../inputTypes';
import {
    baseInputStyle,
    InputWrapper,
    Label,
    getInputStateBgColor,
    INPUT_PADDING_TOP,
    LABEL_TRANSFORM,
} from '../InputStyles';
import { BOTTOM_TEXT_MIN_HEIGHT, BottomText } from '../BottomText';
import { TopAddons } from '../TopAddons';
import { CharacterCount, CharacterCountProps } from './CharacterCount';
import { useElevation } from '../../ElevationContext/ElevationContext';

const Wrapper = styled.div<{ $hasBottomPadding: boolean }>`
    width: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    padding-bottom: ${({ $hasBottomPadding }) =>
        $hasBottomPadding ? `${BOTTOM_TEXT_MIN_HEIGHT}px` : '0'};
`;

const TextareaWrapper = styled(InputWrapper)<{
    disabled?: boolean;
    elevation: Elevation;
    inputState?: InputState;
}>`
    ${baseInputStyle}
    padding: ${spacingsPx.xl} 0 ${spacingsPx.md};

    &:focus-within {
        border-color: ${({ theme }) => theme.borderOnElevation0};
    }

    /* overwrites :read-only:not(:disabled) since it's always true for div */
    ${({ disabled, theme, inputState, elevation }) =>
        !disabled &&
        `
        &:read-only:not(:disabled) {
            background-color: ${getInputStateBgColor(inputState, theme, elevation)};
            color: ${theme.textDefault};
        }
    `}
`;

const StyledTextarea = styled.textarea<
    Pick<TextareaProps, 'inputState'> & { elevation: Elevation }
>`
    ${baseInputStyle}
    padding: 0 ${spacingsPx.md} 0;
    border: none;
    resize: none;
    white-space: pre-wrap;
`;

const TextareaLabel = styled(Label)`
    top: ${INPUT_PADDING_TOP};
    left: ${spacingsPx.md};

    /* move up when input is focused OR has a placeholder OR has value  */
    textarea:focus ~ &,
    textarea:not(:placeholder-shown) ~ &,
    textarea:not([placeholder='']):placeholder-shown ~ & {
        transform: ${LABEL_TRANSFORM};
    }
`;

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    isDisabled?: boolean;
    label?: ReactNode;
    labelHoverAddon?: ReactNode;
    labelRight?: ReactNode;
    innerRef?: Ref<HTMLTextAreaElement>;
    /**
     * @description pass `null` if bottom text can be `undefined`
     */
    bottomText?: ReactNode;
    inputState?: InputState;
    hasBottomPadding?: boolean;
    value?: string;
    characterCount?: CharacterCountProps['characterCount'];
    'data-test'?: string;
}

export const Textarea = ({
    className,
    value,
    maxLength,
    labelHoverAddon,
    isDisabled,
    innerRef,
    label,
    inputState,
    bottomText,
    placeholder,
    rows = 5,
    labelRight,
    characterCount,
    hasBottomPadding = true,
    'data-test': dataTest,
    ...rest
}: TextareaProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const { elevation } = useElevation();

    return (
        <Wrapper
            className={className}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            $hasBottomPadding={hasBottomPadding === true && bottomText === null}
        >
            <TopAddons isHovered={isHovered} hoverAddon={labelHoverAddon} addonRight={labelRight} />

            <TextareaWrapper inputState={inputState} disabled={isDisabled} elevation={elevation}>
                <StyledTextarea
                    elevation={elevation}
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                    maxLength={maxLength}
                    disabled={isDisabled}
                    inputState={inputState}
                    rows={rows}
                    data-test={dataTest}
                    placeholder={placeholder || ''} // needed for uncontrolled inputs
                    ref={innerRef}
                    {...rest}
                />

                <CharacterCount
                    characterCount={characterCount}
                    maxLength={maxLength}
                    value={value}
                />

                {label && <TextareaLabel isDisabled={isDisabled}>{label}</TextareaLabel>}
            </TextareaWrapper>

            {bottomText && (
                <BottomText inputState={inputState} isDisabled={isDisabled}>
                    {bottomText}
                </BottomText>
            )}
        </Wrapper>
    );
};
