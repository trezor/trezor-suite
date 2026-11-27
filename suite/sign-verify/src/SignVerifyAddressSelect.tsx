import { use } from 'react';
import { useController, useFormContext, useWatch } from 'react-hook-form';

import { Address } from '@suite/address';
import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import {
    type SignAddress,
    type SignAddressCategory,
    type SignAddressGroup,
} from '@suite-common/sign-verify';
import { Box, Row, Select, Text } from '@trezor/components';
import { throwError } from '@trezor/utils';

import { SignVerifyContext, type SignVerifyValues } from './SignVerifyContext';
import { SignVerifySubmittedAddress } from './SignVerifySubmittedAddress';
import { WrappingSingleValue } from './WrappingSingleValue';

const CATEGORY_LABELS: Record<SignAddressCategory, TranslationKey> = {
    fresh: 'TR_ADDRESSES_FRESH',
    used: 'TR_ADDRESSES_USED',
    change: 'TR_ADDRESSES_CHANGE',
    stake: 'TR_STAKING_STAKE_ADDRESS',
};

const SELECTABLE_COMPONENTS = { SingleValue: WrappingSingleValue };
const FIXED_COMPONENTS = { SingleValue: WrappingSingleValue, DropdownIndicator: () => null };

type AddressOption = {
    label: string;
    value: string;
};

const toOption = ({ address, path }: SignAddress): AddressOption => ({
    label: address,
    value: path,
});

// A group shares the derivation level of its addresses, as in `m/1/i` for change.
const getPathPattern = (addresses: SignAddress[]) => `m/${addresses[0]?.path.split('/').at(-2)}/i`;

type SignVerifyAddressSelectProps = {
    addressGroups: SignAddressGroup[];
    isFixed?: boolean;
};

export const SignVerifyAddressSelect = ({
    addressGroups,
    isFixed = false,
}: SignVerifyAddressSelectProps) => {
    const { outcome } = use(SignVerifyContext) ?? throwError('Missing SignVerify');
    const { control, setValue } = useFormContext<SignVerifyValues>();
    const {
        field: pathField,
        fieldState: { error: pathError },
    } = useController({ control, name: 'path' });
    const address = useWatch({ control, name: 'address' });

    const { translationString } = useTranslation();

    if (outcome === 'signed') {
        return <SignVerifySubmittedAddress address={address} />;
    }

    const addresses = addressGroups.flatMap(group => group.addresses);
    const selectedAddress = addresses.find(({ path }) => path === pathField.value);
    const options = addressGroups.map(({ category, addresses: groupAddresses }) => ({
        label: category
            ? `${translationString(CATEGORY_LABELS[category])} ${getPathPattern(groupAddresses)}`
            : '',
        options: groupAddresses.map(toOption),
    }));

    return (
        <Select
            name="path"
            label={<Translation id="TR_ADDRESS" />}
            value={selectedAddress ? toOption(selectedAddress) : null}
            options={options}
            onChange={(option: AddressOption | null) => {
                setValue('address', option?.label ?? '');
                pathField.onChange(option?.value ?? '');
            }}
            onBlur={pathField.onBlur}
            formatOptionLabel={(option: AddressOption) => (
                <Row gap={4}>
                    {!isFixed && (
                        <Box minWidth={36}>
                            <Text isDisabled>/{option.value.split('/').pop()}</Text>
                        </Box>
                    )}
                    <Address value={option.label} />
                </Row>
            )}
            isSearchable={!isFixed}
            isDisabled={isFixed}
            isMenuOpen={isFixed ? false : undefined}
            components={isFixed ? FIXED_COMPONENTS : SELECTABLE_COMPONENTS}
            hasError={pathError !== undefined}
            bottomText={
                pathError?.message ? <Translation id={pathError.message as TranslationKey} /> : null
            }
            data-testid="@sign-verify/sign-address"
        />
    );
};
