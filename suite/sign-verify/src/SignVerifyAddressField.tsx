import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { type ReceiveRootState, selectTouchedAddresses } from '@suite-common/receive';
import { type Account } from '@suite-common/wallet-types';
import { Input } from '@trezor/components';

import { CopyFieldButton } from './CopyFieldButton';
import { SignAddressInput } from './SignAddressInput';
import { type SignVerifyFormFields } from './useSignVerifyForm';

type SignVerifyAddressFieldProps = {
    account: Account;
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
    const touchedAddresses = useSelector((state: ReceiveRootState) =>
        selectTouchedAddresses(state, account.key),
    );

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
                touchedAddresses={touchedAddresses}
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
