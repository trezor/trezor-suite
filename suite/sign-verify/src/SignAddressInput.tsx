import { type ReactNode } from 'react';

import { Address } from '@suite/address';
import { type Account, type ReceiveInfo } from '@suite-common/wallet-types';
import { isUtxoBased } from '@suite-common/wallet-utils';
import { Box, Row, Select, type SelectProps, Text } from '@trezor/components';

import { type AddressItem, useSignAddressOptions } from './useSignAddressOptions';

const optionToAddress = (option: AddressItem | null) =>
    option ? { address: option.label, path: option.value } : null;

const WrappingSingleValue = ({ children }: { children?: ReactNode }) => (
    <Text as="div" maxWidth="100%" intent="neutral" priority="primary" padding={{ vertical: 8 }}>
        {children}
    </Text>
);

const wrappedValueComponents = { SingleValue: WrappingSingleValue };
const singleAddressComponents = { ...wrappedValueComponents, DropdownIndicator: () => null };

type SignAddressInputProps = {
    account?: Account;
    touchedAddresses: ReceiveInfo[];
} & SelectProps;

export const SignAddressInput = ({
    account,
    touchedAddresses,
    value,
    onChange,
    ...selectProps
}: SignAddressInputProps) => {
    const { getValue, groupedOptions } = useSignAddressOptions(account, touchedAddresses);

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
            value={getValue(value)}
            options={groupedOptions}
            onChange={option => onChange?.(optionToAddress(option))}
            formatOptionLabel={formatOptionLabel}
            isSearchable={hasMultipleAddresses}
            isMenuOpen={hasMultipleAddresses ? undefined : false}
            components={hasMultipleAddresses ? wrappedValueComponents : singleAddressComponents}
        />
    );
};
