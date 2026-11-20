import { type ReactNode, use } from 'react';
import { type UseFormReturn } from 'react-hook-form';

import { type TrezorDevice } from '@suite-common/suite-types';
import { type VerifyError } from '@trezor/network-module-suite-common-types';
import { type Result, exhaustive } from '@trezor/type-utils';
import { throwError } from '@trezor/utils';

import { SignVerifyContext, type SignVerifyValues } from './SignVerifyContext';
import { SignVerifyForm } from './SignVerifyForm';

type VerifyMessageParams = {
    device: TrezorDevice | undefined;
    address: string;
    message: string;
    signature: string;
    hex: boolean;
};

type SignVerifyVerifyFormProps = {
    form: UseFormReturn<SignVerifyValues>;
    verify: (params: VerifyMessageParams) => Promise<Result<void, VerifyError>>;
    children: ReactNode;
};

export const SignVerifyVerifyForm = ({ form, verify, children }: SignVerifyVerifyFormProps) => {
    const { page, setOutcome } = use(SignVerifyContext) ?? throwError('Missing SignVerify');

    if (page !== 'verify') {
        return null;
    }

    const submit = async (
        { address, message, signature, hex }: SignVerifyValues,
        device: TrezorDevice | undefined,
    ) => {
        const result = await verify({ device, address, message, signature, hex });

        if (result.success) {
            setOutcome(page, 'verified');

            return;
        }

        switch (result.error.type) {
            // Cancelling on the device leaves the form as it was: nothing failed to verify.
            case 'DeviceCancelled':
                break;
            case 'DeviceError':
            case 'DeviceNotConnectedError':
                setOutcome(page, 'failed');
                break;
            default:
                exhaustive(result.error);
        }
    };

    return (
        <SignVerifyForm form={form} submit={submit}>
            {children}
        </SignVerifyForm>
    );
};
