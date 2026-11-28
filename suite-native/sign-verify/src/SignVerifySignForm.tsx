import { type ReactNode, use } from 'react';

import { type SignAddress } from '@suite-common/sign-verify';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type SignError, type SignedMessage } from '@trezor/network-module-suite-common-types';
import { type Result } from '@trezor/type-utils';
import { throwError } from '@trezor/utils';

import {
    EMPTY_VALUES,
    SignVerifyContext,
    type SignVerifyErrors,
    type SignVerifyValues,
} from './SignVerifyContext';
import { SignVerifyForm } from './SignVerifyForm';
import { getMessageErrors } from './getMessageErrors';

type SignMessageParams = {
    device: TrezorDevice | undefined;
    path: string;
    message: string;
    hex: boolean;
};

const getSignErrors = (values: SignVerifyValues): SignVerifyErrors => ({
    address: values.address === '' ? 'forms.errors.mixed.required' : undefined,
    ...getMessageErrors(values),
});

type SignVerifySignFormProps = {
    defaultAddress?: SignAddress;
    sign: (params: SignMessageParams) => Promise<Result<SignedMessage, SignError>>;
    children: ReactNode;
};

export const SignVerifySignForm = ({ defaultAddress, sign, children }: SignVerifySignFormProps) => {
    const { page, setOutcome } = use(SignVerifyContext) ?? throwError('Missing SignVerify');

    if (page !== 'sign') {
        return null;
    }

    const submit = async (
        { path, message, hex }: SignVerifyValues,
        device: TrezorDevice | undefined,
    ) => {
        const result = await sign({ device, path, message, hex });

        if (!result.success) {
            return {};
        }

        setOutcome(page, 'signed');

        return { signature: result.payload.signature };
    };

    const defaultValues = {
        ...EMPTY_VALUES,
        path: defaultAddress?.path ?? '',
        address: defaultAddress?.address ?? '',
    };

    return (
        <SignVerifyForm defaultValues={defaultValues} getErrors={getSignErrors} submit={submit}>
            {children}
        </SignVerifyForm>
    );
};
