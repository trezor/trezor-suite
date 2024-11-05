import { Ref, ReactNode, TextareaHTMLAttributes } from 'react';

import styled from 'styled-components';

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
import { FormCell, FormCellProps, pickFormCellProps } from '../FormCell/FormCell';
import { CharacterCount, CharacterCountProps } from './CharacterCount';
import { useElevation } from '../../ElevationContext/ElevationContext';

const TextareaWrapper = styled(InputWrapper)<{
    disabled?: boolean; // intentionally not transient, disabled is HTML <input> prop
    $elevation: Elevation;
    $inputState?: InputState;
}>`
    ${baseInputStyle}
    padding: ${spacingsPx.xl} 0 ${spacingsPx.md};

    &:focus-within {
        border-color: ${({ theme }) => theme.borderElevation1};
    }

    /* overwrites :read-only:not(:disabled) since it's always true for div */
    ${({ disabled, theme, $inputState, $elevation }) =>
        !disabled &&
        `
        &:read-only:not(:disabled) {
            background-color: ${getInputStateBgColor($inputState, theme, $elevation)};
            color: ${theme.textDefault};
        }
    `}
`;

const StyledTextarea = styled.textarea<{ $inputState?: InputState; $elevation: Elevation }>`
    ${baseInputStyle}
    padding: 0 ${spacingsPx.md} 0;
    border: none;
    resize: none;
    white-space: pre-wrap;

    &:disabled {
        cursor: not-allowed;
        pointer-events: auto;
    }
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

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> &
    Omit<FormCellProps, 'children'> & {
        isDisabled?: boolean;
        label?: ReactNode;
        innerRef?: Ref<HTMLTextAreaElement>;
        hasBottomPadding?: boolean;
        value?: string;
        characterCount?: CharacterCountProps['characterCount'];
        'data-testid'?: string;
    };

export const Textarea = ({
    value,
    maxLength,
    isDisabled = false,
    innerRef,
    label,
    placeholder,
    rows = 5,
    inputState,
    characterCount,
    'data-testid': dataTest,
    ...rest
}: TextareaProps) => {
    const { elevation } = useElevation();
    const formCellProps = pickFormCellProps(rest);

    return (
        <FormCell {...formCellProps} inputState={inputState} isDisabled={isDisabled}>
            <TextareaWrapper $inputState={inputState} disabled={isDisabled} $elevation={elevation}>
                <StyledTextarea
                    $elevation={elevation}
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                    maxLength={maxLength}
                    disabled={isDisabled}
                    $inputState={inputState}
                    rows={rows}
                    data-testid={dataTest}
                    placeholder={placeholder || ''} // needed for uncontrolled inputs
                    ref={innerRef}
                    value={value}
                    {...rest}
                />

                <CharacterCount
                    characterCount={characterCount}
                    maxLength={maxLength}
                    value={value}
                />

                {label && <TextareaLabel $isDisabled={isDisabled}>{label}</TextareaLabel>}
            </TextareaWrapper>
        </FormCell>
    );
};
