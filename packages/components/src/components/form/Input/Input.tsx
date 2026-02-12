import { InputHTMLAttributes, ReactElement, Ref } from 'react';

import styled from 'styled-components';

import { FrameProps } from '../../../utils/frameProps';
import { Box } from '../../Box/Box';
import { Row } from '../../Flex/Flex';
import { Icon } from '../../Icon/Icon';
import { FloatingLabel } from '../FloatingLabel';
import {
    FormCell,
    FormCellProps,
    allowedFormCellFrameProps,
    pickFormCellProps,
} from '../FormCell/FormCell';
import { InputWrapper } from '../InputWrapper';
import { InputSize } from '../types';
import { INPUT_PADDING, commonInputStyles, mapSizeToHeight, mapSizeToPaddingTop } from '../utils';

export const allowedInputFrameProps = allowedFormCellFrameProps;
type AllowedFrameProps = Pick<FrameProps, (typeof allowedInputFrameProps)[number]>;

const StyledInput = styled.input<{
    $hasLabel?: boolean;
    $isMasked?: boolean;
    $size: InputSize;
}>`
    ${commonInputStyles}

    padding: 0 ${INPUT_PADDING}px;
    padding-top: ${({ $hasLabel, $size }) => ($hasLabel ? mapSizeToPaddingTop($size) : 0)}px;

    ${({ $isMasked }) => $isMasked && `-webkit-text-security: disc;`}
`;

type InputHTMLProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>;

export type InputProps = InputHTMLProps &
    AllowedFrameProps &
    Omit<FormCellProps, 'children'> & {
        value?: string;
        innerRef?: Ref<HTMLInputElement>;
        label?: ReactElement | string;
        leftContent?: ReactElement;
        rightContent?: ReactElement;
        size?: InputSize;
        'data-testid'?: string;
        showClearButton?: boolean;
        onClear?: () => void;
        isMasked?: boolean;
    };

export const Input = ({
    value,
    innerRef,
    label,
    leftContent,
    rightContent,
    size = 'large',
    'data-testid': dataTest,
    showClearButton,
    placeholder,
    onClear,
    isMasked,
    ...rest
}: InputProps) => {
    const formCellProps = pickFormCellProps(rest);
    const { isDisabled, hasError } = formCellProps;

    const inputProps = Object.entries(rest).reduce((props, [propKey, propValue]) => {
        if (!(propKey in formCellProps)) {
            props[propKey as keyof InputHTMLProps] = propValue;
        }

        return props;
    }, {} as InputHTMLProps);

    const hasShowClearButton = showClearButton && !!value && value.length > 0;

    return (
        <FormCell {...formCellProps} data-testid={dataTest}>
            <InputWrapper hasError={hasError} isDisabled={isDisabled ?? false} size={size}>
                <Row height={mapSizeToHeight(size)}>
                    {leftContent && (
                        <Row
                            flex="0 0 auto"
                            padding={{ left: INPUT_PADDING }}
                            data-testid={`${dataTest}/input-addon`}
                        >
                            {leftContent}
                        </Row>
                    )}

                    <Box flex="1" height="100%" position={{ type: 'relative' }}>
                        <StyledInput
                            value={value}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            disabled={isDisabled ?? false}
                            $hasLabel={!!label}
                            ref={innerRef}
                            data-lpignore="true"
                            $isMasked={isMasked}
                            $size={size}
                            placeholder={placeholder}
                            data-testid={dataTest}
                            {...inputProps}
                        />
                        {label && (
                            <FloatingLabel
                                $isDisabled={isDisabled}
                                $isActive={!!value || !!placeholder}
                            >
                                {label}
                            </FloatingLabel>
                        )}
                    </Box>

                    {(rightContent || hasShowClearButton) && (
                        <Row
                            flex="0 0 auto"
                            padding={{ right: INPUT_PADDING }}
                            data-testid={`${dataTest}/input-addon`}
                            gap={12}
                        >
                            {rightContent}
                            {hasShowClearButton && (
                                <Icon
                                    name="x"
                                    size={16}
                                    variant="default"
                                    onClick={onClear}
                                    cursor="pointer"
                                />
                            )}
                        </Row>
                    )}
                </Row>
            </InputWrapper>
        </FormCell>
    );
};
