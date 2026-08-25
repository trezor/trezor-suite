import { type UseFormRegisterReturn } from 'react-hook-form';

import { useTranslation } from '@suite/intl';
import { Input } from '@trezor/components';

import { CopyFieldButton } from './CopyFieldButton';
import { MAX_LENGTH_SIGNATURE } from './useSignVerifyForm';

type SignVerifySignatureFieldProps = {
    signature?: string;
    isSignPage: boolean;
    isCompleted: boolean;
    hasError: boolean;
    errorMessage?: string;
    registration: UseFormRegisterReturn<'signature'>;
    onCopy: (value: string) => void;
};

export const SignVerifySignatureField = ({
    signature,
    isSignPage,
    isCompleted,
    hasError,
    errorMessage,
    registration,
    onCopy,
}: SignVerifySignatureFieldProps) => {
    const { translationString } = useTranslation();
    const { ref, ...field } = registration;

    return (
        <Input
            label={translationString('TR_SIGNATURE')}
            maxLength={MAX_LENGTH_SIGNATURE}
            type="text"
            readOnly={isSignPage || isCompleted}
            isDisabled={isSignPage && !signature?.length}
            placeholder={
                isSignPage ? translationString('TR_SIGNATURE_AFTER_SIGNING_PLACEHOLDER') : undefined
            }
            hasError={hasError}
            bottomText={errorMessage}
            rightContent={
                isCompleted ? (
                    <CopyFieldButton
                        onClick={() => onCopy(signature || '')}
                        data-testid="@sign-verify/copy-signature"
                    />
                ) : undefined
            }
            data-testid="@sign-verify/signature"
            innerRef={ref}
            {...field}
        />
    );
};
