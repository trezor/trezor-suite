import { type ReactNode, type Ref, type TextareaHTMLAttributes } from 'react';

import styled, { css } from 'styled-components';

import { spacingsPx } from '@trezor/theme';

import { CharacterCount, type CharacterCountProps } from './CharacterCount';
import { type FrameProps, type FramePropsKeys } from '../../../utils/frameProps';
import { Box } from '../../Box/Box';
import { FloatingLabel } from '../FloatingLabel';
import { FormCell, type FormCellProps, pickFormCellProps } from '../FormCell/FormCell';
import { InputWrapper } from '../InputWrapper';
import { INPUT_PADDING, commonInputStyles } from '../utils';

export const allowedTextareaFrameProps = ['margin', 'flex'] as const satisfies FramePropsKeys[];

type AllowedFrameProps = Pick<FrameProps, (typeof allowedTextareaFrameProps)[number]>;

const StyledTextarea = styled.textarea<{ $hasLabel?: boolean }>`
    ${commonInputStyles}

    display: block;
    white-space: pre-wrap;
    resize: none;
    padding: ${INPUT_PADDING}px;

    ${({ $hasLabel }) =>
        $hasLabel &&
        css`
            margin-top: ${spacingsPx.xl};
            padding-top: 0;
        `}
`;

// TODO: Just not use FloatingLabel in Textarea, but placeholder instead?
const StyledFloatingLabel = styled(FloatingLabel)`
    top: ${spacingsPx.xl};
`;

type TextareaHTMLProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export type TextareaProps = AllowedFrameProps &
    TextareaHTMLProps &
    Omit<FormCellProps, 'children'> & {
        isDisabled?: boolean;
        label?: ReactNode;
        innerRef?: Ref<HTMLTextAreaElement>;
        value?: string;
        characterCount?: CharacterCountProps['characterCount'];
        'data-testid'?: string;
        placeholder?: string;
    };

export const Textarea = ({
    value,
    maxLength,
    innerRef,
    label,
    rows = 5,
    characterCount,
    'data-testid': dataTest,
    placeholder,
    ...rest
}: TextareaProps) => {
    const formCellProps = pickFormCellProps(rest);
    const { isDisabled, hasError } = formCellProps;
    const textareaProps = Object.entries(rest).reduce((props, [propKey, propValue]) => {
        if (!(propKey in formCellProps)) {
            props[propKey as keyof TextareaHTMLProps] = propValue;
        }

        return props;
    }, {} as TextareaHTMLProps);

    return (
        <FormCell {...formCellProps}>
            <InputWrapper hasError={hasError} isDisabled={isDisabled}>
                <StyledTextarea
                    $hasLabel={!!label}
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                    maxLength={maxLength}
                    disabled={isDisabled ?? false}
                    rows={rows}
                    data-testid={dataTest}
                    placeholder={label ? placeholder || ' ' : placeholder}
                    ref={innerRef}
                    value={value}
                    {...textareaProps}
                />
                {label && (
                    <StyledFloatingLabel
                        $isDisabled={isDisabled}
                        $isActive={!!value || !!placeholder}
                    >
                        {label}
                    </StyledFloatingLabel>
                )}
                <Box position={{ type: 'absolute', bottom: INPUT_PADDING, right: INPUT_PADDING }}>
                    <CharacterCount
                        characterCount={characterCount}
                        maxLength={maxLength}
                        value={value}
                    />
                </Box>
            </InputWrapper>
        </FormCell>
    );
};
