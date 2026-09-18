import { Translation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { Input } from '@trezor/components';

import { CopyFieldButton } from './CopyFieldButton';
import { SignAddressInput } from './SignAddressInput';
import { type SignAddresses } from './types';
import { type SignVerifyFormFields } from './useSignVerifyForm';

type SignVerifyAddressFieldProps = {
    account: Account;
    signAddresses: SignAddresses;
    isSignPage: boolean;
    isCompleted: boolean;
    address?: string;
    pathField: SignVerifyFormFields['pathField'];
    addressField: SignVerifyFormFields['addressField'];
    pathError?: string;
    addressError?: string;
    hasPathError: boolean;
    hasAddressError: boolean;
    onCopy: (value: string) => void;
};

export const SignVerifyAddressField = ({
    account,
    signAddresses,
    isSignPage,
    isCompleted,
    address,
    pathField,
    addressField,
    pathError,
    addressError,
    hasPathError,
    hasAddressError,
    onCopy,
}: SignVerifyAddressFieldProps) => {
    if (isCompleted) {
        return (
            <Input
                label={<Translation id="TR_ADDRESS" />}
                type="text"
                readOnly
                value={address ?? ''}
                rightContent={
                    <CopyFieldButton
                        onClick={() => onCopy(address || '')}
                        data-testid="@sign-verify/copy-address"
                    />
                }
                data-testid="@sign-verify/submitted-address"
            />
        );
    }

    if (isSignPage) {
        return (
            <SignAddressInput
                name="path"
                label={<Translation id="TR_ADDRESS" />}
                account={account}
                signAddresses={signAddresses}
                hasError={hasPathError}
                bottomText={pathError || null}
                data-testid="@sign-verify/sign-address"
                {...pathField}
            />
        );
    }

    return (
        <Input
            name="address"
            label={<Translation id="TR_ADDRESS" />}
            type="text"
            hasError={hasAddressError}
            bottomText={addressError || null}
            data-testid="@sign-verify/select-address"
            {...addressField}
        />
    );
};
