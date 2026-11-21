import { type ReactNode } from 'react';

import { Address } from '@suite/address';
import { type TranslationKey, useTranslation } from '@suite/intl';
import {
    type SignAddress,
    type SignAddressCategory,
    type SignAddressGroup,
} from '@suite-common/sign-verify';
import { type Account } from '@suite-common/wallet-types';
import { isUtxoBased } from '@suite-common/wallet-utils';
import { Box, Row, Select, type SelectProps, Text } from '@trezor/components';

const CATEGORY_LABELS: Record<SignAddressCategory, TranslationKey> = {
    fresh: 'TR_ADDRESSES_FRESH',
    used: 'TR_ADDRESSES_USED',
    change: 'TR_ADDRESSES_CHANGE',
    stake: 'TR_STAKING_STAKE_ADDRESS',
};

type AddressItem = {
    label: string;
    value: string;
};

const toAddressItem = ({ address, path }: SignAddress): AddressItem => ({
    label: address,
    value: path,
});

// A group shares the derivation level of its addresses, as in `m/1/i` for change.
const getPathPattern = (addresses: SignAddress[]) => `m/${addresses[0]?.path.split('/').at(-2)}/i`;

const optionToAddress = (option: AddressItem | null) =>
    option ? { address: option.label, path: option.value } : null;
type WrappingSingleValueProps = { children?: ReactNode };

const WrappingSingleValue = ({ children }: WrappingSingleValueProps) => (
    <Text as="div" maxWidth="100%" intent="neutral" priority="primary" padding={{ vertical: 8 }}>
        {children}
    </Text>
);

const wrappedValueComponents = { SingleValue: WrappingSingleValue };
const singleAddressComponents = { ...wrappedValueComponents, DropdownIndicator: () => null };

type SignAddressInputProps = {
    account?: Account;
    addressGroups: SignAddressGroup[];
} & SelectProps;

export const SignAddressInput = ({
    account,
    addressGroups,
    value,
    onChange,
    ...selectProps
}: SignAddressInputProps) => {
    const { translationString } = useTranslation();

    const selectedAddress = addressGroups
        .flatMap(group => group.addresses)
        .find(({ path }) => path === value);

    const groupedOptions = addressGroups.map(({ category, addresses }) => ({
        label: category
            ? `${translationString(CATEGORY_LABELS[category])} ${getPathPattern(addresses)}`
            : '',
        options: addresses.map(toAddressItem),
    }));

    const hasMultipleAddresses = !!account && isUtxoBased(account);

    const formatOptionLabel = (option: AddressItem) => (
        <Row gap={4}>
            {hasMultipleAddresses && (
                <Box minWidth={36}>
                    <Text isDisabled>/{option.value.split('/').pop()}</Text>
                </Box>
            )}
            <Address value={option.label} />
        </Row>
    );

    return (
        <Select
            {...selectProps}
            value={selectedAddress ? toAddressItem(selectedAddress) : null}
            options={groupedOptions}
            onChange={option => onChange?.(optionToAddress(option))}
            formatOptionLabel={formatOptionLabel}
            isSearchable={hasMultipleAddresses}
            isMenuOpen={hasMultipleAddresses ? undefined : false}
            components={hasMultipleAddresses ? wrappedValueComponents : singleAddressComponents}
        />
    );
};
