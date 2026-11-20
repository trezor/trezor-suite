import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import {
    type SignAddressGroup,
    type SignAddressesRootState,
    selectAccountSignAddresses,
} from '@suite-common/sign-verify';
import { type Account } from '@suite-common/wallet-types';
import { Input } from '@trezor/components';
import { getStakingPath } from '@trezor/network-cardano-suite-common';

import { CopyFieldButton } from './CopyFieldButton';
import { SignAddressInput } from './SignAddressInput';
import { type SignVerifyFormFields } from './useSignVerifyForm';

const getAccountAddressGroups = (
    account: Account,
    signAddressGroups: SignAddressGroup[],
): SignAddressGroup[] => {
    switch (account.networkType) {
        // Ethereum signs with the account itself, it has no address list.
        case 'ethereum':
            return [{ addresses: [{ address: account.descriptor, path: account.path }] }];
        case 'cardano':
            return [
                {
                    category: 'stake',
                    addresses: [
                        { path: getStakingPath(account), address: account.misc.staking.address },
                    ],
                },
                ...signAddressGroups,
            ];
        default:
            return signAddressGroups;
    }
};

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
    const signAddressGroups = useSelector((state: SignAddressesRootState) =>
        selectAccountSignAddresses(state, account),
    );
    const addressGroups = getAccountAddressGroups(account, signAddressGroups);

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
                addressGroups={addressGroups}
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
