import { type UseFormRegisterReturn } from 'react-hook-form';

import { useTranslation } from '@suite/intl';
import { Input } from '@trezor/components';

import { CopyFieldButton } from './CopyFieldButton';

type SignVerifyPubKeyFieldProps = {
    pubKey?: string;
    isCompleted: boolean;
    hasError: boolean;
    errorMessage?: string;
    registration: UseFormRegisterReturn<'pubKey'>;
    onCopy: (value: string) => void;
};

export const SignVerifyPubKeyField = ({
    pubKey,
    isCompleted,
    hasError,
    errorMessage,
    registration,
    onCopy,
}: SignVerifyPubKeyFieldProps) => {
    const { translationString } = useTranslation();
    const { ref, ...field } = registration;

    return (
        <Input
            label={translationString('TR_PUBLIC_KEY')}
            type="text"
            readOnly
            isDisabled={!pubKey?.length}
            placeholder={translationString('TR_SIGNATURE_AFTER_SIGNING_PLACEHOLDER')}
            hasError={hasError}
            bottomText={errorMessage}
            rightContent={
                isCompleted ? (
                    <CopyFieldButton
                        onClick={() => onCopy(pubKey || '')}
                        data-testid="@sign-verify/copy-pubkey"
                    />
                ) : undefined
            }
            data-testid="@sign-verify/pubKey"
            innerRef={ref}
            {...field}
        />
    );
};
