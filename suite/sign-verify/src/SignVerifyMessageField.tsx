import { type UseFormRegisterReturn } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { Box, Switch, Textarea } from '@trezor/components';

import { CopyFieldButton } from './CopyFieldButton';
import { MAX_LENGTH_MESSAGE, type SignVerifyFormFields } from './useSignVerifyForm';

const FIELD_PADDING = 16;

type SignVerifyMessageFieldProps = {
    message?: string;
    isCompleted: boolean;
    hasError: boolean;
    errorMessage?: string;
    hexField: SignVerifyFormFields['hexField'];
    registration: UseFormRegisterReturn<'message'>;
    onCopy: (value: string) => void;
};

export const SignVerifyMessageField = ({
    message,
    isCompleted,
    hasError,
    errorMessage,
    hexField,
    registration,
    onCopy,
}: SignVerifyMessageFieldProps) => {
    const { ref, ...field } = registration;

    return (
        <Box position={{ type: 'relative' }}>
            <Textarea
                label={<Translation id="TR_MESSAGE" />}
                readOnly={isCompleted}
                hasError={hasError}
                characterCount={
                    isCompleted
                        ? undefined
                        : {
                              current: message?.length,
                              max: MAX_LENGTH_MESSAGE,
                          }
                }
                bottomText={errorMessage || null}
                rows={4}
                data-testid="@sign-verify/message"
                innerRef={ref}
                {...field}
            />
            <Box
                position={{
                    type: 'absolute',
                    top: FIELD_PADDING,
                    right: FIELD_PADDING,
                }}
            >
                {isCompleted ? (
                    <CopyFieldButton
                        onClick={() => onCopy(message || '')}
                        data-testid="@sign-verify/copy-message"
                    />
                ) : (
                    <Switch
                        label={<Translation id="TR_HEX_FORMAT" />}
                        labelPosition="start"
                        {...hexField}
                    />
                )}
            </Box>
        </Box>
    );
};
