import { type ReactNode, use } from 'react';

import { injectAddressValidator } from '@suite-common/networks';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { useServices } from '@trezor/dependency-injection';
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

type SignVerifyVerifyFormProps = {
    symbol: NetworkSymbol;
    verify: (params: VerifyMessageParams) => Promise<Result<void, VerifyError>>;
    children: ReactNode;
};

export const SignVerifyVerifyForm = ({ symbol, verify, children }: SignVerifyVerifyFormProps) => {
    const { page, setOutcome } = use(SignVerifyContext) ?? throwError('Missing SignVerify');
    const { addressValidator } = useServices(injectAddressValidator);

    if (page !== 'verify') {
        return null;
    }

    const getVerifyErrors = (values: SignVerifyValues): SignVerifyErrors => ({
        address: addressValidator.isAddressValid(values.address, symbol)
            ? undefined
            : 'TR_ADD_TOKEN_ADDRESS_NOT_VALID',
        ...getMessageErrors(values),
        signature: values.signature === '' ? 'TR_REQUIRED_FIELD' : undefined,
    });

    const submit = async (
        { address, message, signature, hex }: SignVerifyValues,
        device: TrezorDevice | undefined,
    ) => {
        const result = await verify({ device, address, message, signature, hex });

        if (result.success) {
            setOutcome('verified');

            return {};
        }

        switch (result.error.type) {
            // Cancelling on the device leaves the form as it was: nothing failed to verify.
            case 'DeviceCancelled':
                break;
            case 'DeviceError':
            case 'DeviceNotConnectedError':
                setOutcome('failed');
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
