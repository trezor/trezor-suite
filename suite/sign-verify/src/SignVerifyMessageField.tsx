import { type UseFormRegisterReturn } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { MAX_LENGTH_MESSAGE } from '@suite-common/sign-verify';
import { Switch, Textarea } from '@trezor/components';

import { CopyFieldButton } from './CopyFieldButton';

type SignVerifyMessageFieldProps = {
    message?: string;
    isCompleted: boolean;
    hasError: boolean;
    errorMessage?: string;
    hexField: { isChecked: boolean; onChange: (isChecked: boolean) => void };
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
        <Textarea
            labelLeft={<Translation id="TR_MESSAGE" />}
            labelRight={
                isCompleted ? (
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
                )
            }
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
    );
};
