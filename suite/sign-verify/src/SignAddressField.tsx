import { Translation } from '@suite/intl';

import { SignAddressInput } from './SignAddressInput';
import { SubmittedAddressField } from './SubmittedAddressField';
import { type SignAddress } from './types';
import { type SignVerifyFormFields } from './useSignVerifyForm';

type SignAddressFieldProps = {
    addresses: SignAddress[];
    isAddressSelectable: boolean;
    isCompleted: boolean;
    address?: string;
    pathField: SignVerifyFormFields['pathField'];
    error?: string;
    hasError: boolean;
    onCopy: (value: string) => void;
};

export const SignAddressField = ({
    addresses,
    isAddressSelectable,
    isCompleted,
    address,
    pathField,
    error,
    hasError,
    onCopy,
}: SignAddressFieldProps) => {
    if (isCompleted) {
        return <SubmittedAddressField address={address} onCopy={onCopy} />;
    }

    return (
        <SignAddressInput
            name="path"
            label={<Translation id="TR_ADDRESS" />}
            addresses={addresses}
            isAddressSelectable={isAddressSelectable}
            hasError={hasError}
            bottomText={error || null}
            data-testid="@sign-verify/sign-address"
            {...pathField}
        />
    );
};
