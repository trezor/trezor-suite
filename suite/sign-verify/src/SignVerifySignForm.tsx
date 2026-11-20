import { type ReactNode, use } from 'react';
import { type UseFormReturn } from 'react-hook-form';

import { type TrezorDevice } from '@suite-common/suite-types';
import { type SignError, type SignedMessage } from '@trezor/network-module-suite-common-types';
import { type Result } from '@trezor/type-utils';
import { throwError } from '@trezor/utils';

import { SignVerifyContext, type SignVerifyValues } from './SignVerifyContext';
import { SignVerifyForm } from './SignVerifyForm';

type SignMessageParams = {
    device: TrezorDevice | undefined;
    path: string;
    address: string;
    message: string;
    hex: boolean;
    format: string;
};

type SignVerifySignFormProps = {
    form: UseFormReturn<SignVerifyValues>;
    sign: (params: SignMessageParams) => Promise<Result<SignedMessage, SignError>>;
    children: ReactNode;
};

export const SignVerifySignForm = ({ form, sign, children }: SignVerifySignFormProps) => {
    const { page, setOutcome } = use(SignVerifyContext) ?? throwError('Missing SignVerify');

    if (page !== 'sign') {
        return null;
    }

    const submit = async (
        { path, address, message, hex, format }: SignVerifyValues,
        device: TrezorDevice | undefined,
    ) => {
        const result = await sign({ device, path, address, message, hex, format });

        if (!result.success) {
            return;
        }

        form.setValue('signature', result.payload.signature);
        form.setValue('pubKey', result.payload.pubKey ?? '');
        setOutcome(page, 'signed');
    };

    return (
        <SignVerifyForm form={form} submit={submit}>
            {children}
        </SignVerifyForm>
    );
};
