import styled from 'styled-components';
import { useState, Ref, ReactNode, TextareaHTMLAttributes } from 'react';
import { spacingsPx } from '@trezor/theme';

import { InputState } from '../inputTypes';
import { baseInputStyle, InputWrapper, Label, getInputStateBgColor } from '../InputStyles';
import { BottomText } from '../BottomText';
import { TopAddons } from '../TopAddons';
import { CharacterCount } from './CharacterCount';

const Wrapper = styled.div`
    width: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
`;

const TextareaWrapper = styled(InputWrapper)`
    ${baseInputStyle}
    padding: ${spacingsPx.xl} 0 ${spacingsPx.md};

    :focus-within {
        border-color: ${({ theme }) => theme.borderOnElevation0};
    }

    /* overwrites :read-only:not(:disabled) since it's always true for div */
    ${({ disabled, theme, inputState }) =>
        !disabled &&
        `
        :read-only:not(:disabled) {
            background-color: ${getInputStateBgColor(inputState, theme)};
            color: ${theme.textDefault};
        }
    `}
`;

const StyledTextarea = styled.textarea<Pick<TextareaProps, 'inputState'>>`
    ${baseInputStyle}

    width: 100%;
    padding: 0 ${spacingsPx.md} 0;
    border: none;
    resize: none;
    white-space: pre-wrap;
`;

const TextareaLabel = styled(Label)`
    top: ${spacingsPx.md};
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
    value?: string;
    characterCount?: boolean | { current: number; max: number };
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
    'data-test': dataTest,
    ...rest
}: TextareaProps) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Wrapper
            className={className}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            data-test={dataTest}
        >
            <TopAddons isHovered={isHovered} hoverAddon={labelHoverAddon} addonRight={labelRight} />

            <TextareaWrapper inputState={inputState} disabled={isDisabled}>
                <StyledTextarea
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                    maxLength={maxLength}
                    disabled={isDisabled}
                    inputState={inputState}
                    rows={rows}
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
