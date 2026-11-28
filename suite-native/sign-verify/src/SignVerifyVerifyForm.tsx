import { type ReactNode, use } from 'react';

import { MAX_LENGTH_SIGNATURE } from '@suite-common/sign-verify';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type VerifyError } from '@trezor/network-module-suite-common-types';
import { type Result, exhaustive } from '@trezor/type-utils';
import { throwError } from '@trezor/utils';

import {
    EMPTY_VALUES,
    SignVerifyContext,
    type SignVerifyErrors,
    type SignVerifyValues,
} from './SignVerifyContext';
import { SignVerifyForm } from './SignVerifyForm';
import { getMessageErrors } from './getMessageErrors';

type VerifyMessageParams = {
    device: TrezorDevice | undefined;
    address: string;
    message: string;
    signature: string;
    hex: boolean;
};

const getSignatureError = (signature: string) => {
    if (signature === '') {
        return 'forms.errors.mixed.required';
    }

    return signature.length > MAX_LENGTH_SIGNATURE ? 'forms.errors.string.max' : undefined;
};

const getVerifyErrors = (values: SignVerifyValues): SignVerifyErrors => ({
    address: values.address === '' ? 'forms.errors.mixed.required' : undefined,
    ...getMessageErrors(values),
    signature: getSignatureError(values.signature),
});

type SignVerifyVerifyFormProps = {
    verify: (params: VerifyMessageParams) => Promise<Result<void, VerifyError>>;
    children: ReactNode;
};

export const SignVerifyVerifyForm = ({ verify, children }: SignVerifyVerifyFormProps) => {
    const { page, setOutcome } = use(SignVerifyContext) ?? throwError('Missing SignVerify');

    if (page !== 'verify') {
        return null;
    }

    const submit = async (
        { address, message, signature }: SignVerifyValues,
        device: TrezorDevice | undefined,
    ) => {
        const result = await verify({ device, address, message, signature, hex: false });

        if (result.success) {
            setOutcome(page, 'verified');

            return {};
        }

        switch (result.error.type) {
            // Rejecting the prompt on the device says nothing about the signature.
            case 'DeviceCancelled':
                break;
            case 'DeviceError':
            case 'DeviceNotConnectedError':
                setOutcome(page, 'failed');
                break;
            default:
                exhaustive(result.error);
        }

        return {};
    };

    return (
        <SignVerifyForm defaultValues={EMPTY_VALUES} getErrors={getVerifyErrors} submit={submit}>
            {children}
        </SignVerifyForm>
    );
};
