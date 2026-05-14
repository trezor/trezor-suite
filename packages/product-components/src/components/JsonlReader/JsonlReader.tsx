import { type ChangeEvent, type ReactNode, useId, useRef, useState } from 'react';

import styled from 'styled-components';
import type { ObjectSchema } from 'yup';

import {
    Button,
    type ButtonProps,
    Column,
    FormCell,
    type FormCellProps,
    type FrameProps,
    type FramePropsKeys,
    pickFormCellProps,
} from '@trezor/components';
import { type Result, err, exhaustive, ok } from '@trezor/type-utils';

import { type ParseJsonlError, parseJsonl } from './parseJsonl';

export const allowedJsonlReaderFrameProps = [
    'margin',
    'width',
    'maxWidth',
    'flex',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedJsonlReaderFrameProps)[number]>;

const HiddenInput = styled.input`
    display: none;
`;

const ButtonWrapper = styled.span`
    display: inline-flex;
`;

export type JsonlReaderError =
    | ParseJsonlError
    | {
          type: 'FailedToReadFile';
      };

type FailedToReadFileError = Extract<JsonlReaderError, { type: 'FailedToReadFile' }>;

export type JsonlReaderProps<T extends Record<string, unknown> = Record<string, unknown>> =
    AllowedFrameProps &
        Omit<FormCellProps, 'children'> & {
            buttonLabel: ReactNode;
            loadingLabel: ReactNode;
            schema: ObjectSchema<T>;
            onDataLoaded: (data: T[]) => void;
            onError?: (error: JsonlReaderError) => void;
            variant?: 'form-cell' | 'button';
            iconLeft?: ButtonProps['iconLeft'] | null;
        } & Pick<ButtonProps, 'intent' | 'minWidth' | 'priority' | 'size'> & {
            'data-testid'?: string;
        };

const mapLoadResultToJsonlReaderError = (result: unknown): FailedToReadFileError | undefined => {
    if (typeof result === 'string') {
        return undefined;
    }

    return { type: 'FailedToReadFile' };
};

const readFileAsText = (file: File): Promise<Result<string, FailedToReadFileError>> =>
    new Promise(resolve => {
        const reader = new FileReader();

        reader.onload = loadEvent => {
            const result = loadEvent.target?.result;
            const error = mapLoadResultToJsonlReaderError(result);

            if (error) {
                resolve(err(error));

                return;
            }

            resolve(ok(result as string));
        };

        reader.onerror = () => {
            resolve(err({ type: 'FailedToReadFile' }));
        };

        reader.readAsText(file);
    });

export const formatJsonlReaderError = (error: JsonlReaderError): string => {
    switch (error.type) {
        case 'FailedToReadFile':
            return 'Failed to read file.';
        case 'JsonlInvalidJson':
            return `Error parsing JSONL on line ${error.lineNumber}: ${error.message}`;
        case 'JsonlRecordIsNotObject':
            return `Error parsing JSONL on line ${error.lineNumber}: Expected a JSON object.`;
        case 'JsonlRecordDoesNotMatchSchema':
            return `Error validating JSONL on line ${error.lineNumber}: ${error.message}`;
        default:
            return exhaustive(error);
    }
};

export const JsonlReader = <T extends Record<string, unknown> = Record<string, unknown>>({
    buttonLabel,
    loadingLabel,
    schema,
    onDataLoaded,
    onError,
    variant = 'form-cell',
    iconLeft,
    intent = 'neutral',
    priority = 'secondary',
    size,
    minWidth,
    'data-testid': dataTestId,
    ...rest
}: JsonlReaderProps<T>) => {
    const inputId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);

    const formCellProps = pickFormCellProps(rest);
    const { isDisabled, hasError, bottomText } = formCellProps;
    const resolvedIconLeft = iconLeft === null ? undefined : (iconLeft ?? 'fileText');

    const handleError = (error: JsonlReaderError) => {
        onError?.(error);
    };

    const handleTriggerClick = () => {
        inputRef.current?.click();
    };

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const inputElement = event.currentTarget;
        const file = inputElement.files?.[0];

        if (!file) {
            return;
        }

        setIsLoading(true);

        const fileContentResult = await readFileAsText(file);

        if (!fileContentResult.success) {
            setIsLoading(false);
            inputElement.value = '';
            handleError(fileContentResult.error);

            return;
        }

        const parsedDataResult = parseJsonl(fileContentResult.payload, schema);

        if (!parsedDataResult.success) {
            setIsLoading(false);
            inputElement.value = '';
            handleError(parsedDataResult.error);

            return;
        }

        setIsLoading(false);
        inputElement.value = '';
        onDataLoaded(parsedDataResult.payload);
    };

    const button = (
        <ButtonWrapper>
            <HiddenInput
                id={inputId}
                ref={inputRef}
                type="file"
                accept=".jsonl,application/jsonl,application/x-ndjson"
                disabled={isDisabled || isLoading}
                onChange={handleFileChange}
                data-testid={dataTestId ? `${dataTestId}/input` : undefined}
            />

            <Button
                intent={intent}
                priority={priority}
                size={size}
                iconLeft={resolvedIconLeft}
                isLoading={isLoading}
                isDisabled={isDisabled}
                minWidth={minWidth}
                onClick={handleTriggerClick}
                data-testid={dataTestId ? `${dataTestId}/button` : undefined}
            >
                {isLoading ? loadingLabel : buttonLabel}
            </Button>
        </ButtonWrapper>
    );

    if (variant === 'button') {
        return button;
    }

    return (
        <FormCell
            {...formCellProps}
            bottomText={bottomText}
            hasError={hasError}
            data-testid={dataTestId}
        >
            <Column gap={8}>{button}</Column>
        </FormCell>
    );
};
