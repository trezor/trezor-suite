import { Translation } from '@suite/intl';
import { Input } from '@trezor/components';

import { SubmittedAddressField } from './SubmittedAddressField';
import { type SignVerifyFormFields } from './useSignVerifyForm';

type VerifyAddressFieldProps = {
    isCompleted: boolean;
    address?: string;
    addressField: SignVerifyFormFields['addressField'];
    error?: string;
    hasError: boolean;
    onCopy: (value: string) => void;
};

export const VerifyAddressField = ({
    isCompleted,
    address,
    addressField,
    error,
    hasError,
    onCopy,
}: VerifyAddressFieldProps) => {
    if (isCompleted) {
        return <SubmittedAddressField address={address} onCopy={onCopy} />;
    }

    return (
        <Input
            name="address"
            label={<Translation id="TR_ADDRESS" />}
            type="text"
            hasError={hasError}
            bottomText={error || null}
            data-testid="@sign-verify/select-address"
            {...addressField}
        />
    );
};
