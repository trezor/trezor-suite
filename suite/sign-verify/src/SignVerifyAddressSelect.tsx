import { use } from 'react';

import { Address } from '@suite/address';
import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import {
    type SignAddress,
    type SignAddressCategory,
    type SignAddressGroup,
} from '@suite-common/sign-verify';
import { Box, Row, Select, Text } from '@trezor/components';
import { throwError } from '@trezor/utils';

import { SignVerifyContext, SignVerifyFormContext } from './SignVerifyContext';
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
};

export const SignVerifyAddressSelect = ({ addressGroups }: SignVerifyAddressSelectProps) => {
    const { outcome } = use(SignVerifyContext) ?? throwError('Missing SignVerify');
    const { values, errors, update } =
        use(SignVerifyFormContext) ?? throwError('Missing SignVerify form');

    const { translationString } = useTranslation();

    if (outcome === 'signed') {
        return <SignVerifySubmittedAddress address={values.address} />;
    }

    const addresses = addressGroups.flatMap(group => group.addresses);
    const selectedAddress = addresses.find(({ path }) => path === values.path);
    // A single address that is already selected is the only one the account can sign with.
    const isSelectable = addresses.length > 1 || selectedAddress === undefined;
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
            onChange={(option: AddressOption | null) =>
                update({ path: option?.value ?? '', address: option?.label ?? '' })
            }
            formatOptionLabel={(option: AddressOption) => (
                <Row gap={4}>
                    {isSelectable && (
                        <Box minWidth={36}>
                            <Text isDisabled>/{option.value.split('/').pop()}</Text>
                        </Box>
                    )}
                    <Address value={option.label} />
                </Row>
            )}
            isSearchable={isSelectable}
            isDisabled={!isSelectable}
            isMenuOpen={isSelectable ? undefined : false}
            components={isSelectable ? SELECTABLE_COMPONENTS : FIXED_COMPONENTS}
            hasError={errors.path !== undefined}
            bottomText={errors.path ? <Translation id={errors.path} /> : null}
            data-testid="@sign-verify/sign-address"
        />
    );
};
