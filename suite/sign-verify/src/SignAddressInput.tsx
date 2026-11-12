import { type ReactNode } from 'react';

import { Address } from '@suite/address';
import { Box, Row, Select, type SelectProps, Text } from '@trezor/components';

import { type SignAddress } from './types';
import { type AddressItem, useSignAddressOptions } from './useSignAddressOptions';

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
    addresses: SignAddress[];
    isAddressSelectable: boolean;
} & SelectProps;

export const SignAddressInput = ({
    addresses,
    isAddressSelectable,
    value,
    onChange,
    ...selectProps
}: SignAddressInputProps) => {
    const { getValue, groupedOptions } = useSignAddressOptions(addresses);

    const formatOptionLabel = (option: AddressItem) => (
        <Row gap={4}>
            {isAddressSelectable && (
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
            value={getValue(value)}
            options={groupedOptions}
            onChange={option => onChange?.(optionToAddress(option))}
            formatOptionLabel={formatOptionLabel}
            isSearchable={isAddressSelectable}
            isDisabled={!isAddressSelectable}
            isMenuOpen={isAddressSelectable ? undefined : false}
            components={isAddressSelectable ? wrappedValueComponents : singleAddressComponents}
        />
    );
};
