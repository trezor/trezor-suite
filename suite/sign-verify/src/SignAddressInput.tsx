import { Address } from '@suite/address';
import { type Account, type ReceiveInfo } from '@suite-common/wallet-types';
import { Box, Row, Select, type SelectProps, Text } from '@trezor/components';

import { type AddressItem, useSignAddressOptions } from './useSignAddressOptions';

const optionToAddress = (option: AddressItem | null) =>
    option ? { address: option.label, path: option.value } : null;

const formatOptionLabel = (option: AddressItem) => (
    <Row gap={4}>
        <Box minWidth={36}>
            <Text isDisabled>/{option.value.split('/').pop()}</Text>
        </Box>
        <Address value={option.label} isTruncated />
    </Row>
);

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

    return (
        <Select
            value={getValue(value)}
            options={groupedOptions}
            onChange={option => onChange?.(optionToAddress(option))}
            formatOptionLabel={formatOptionLabel}
            isSearchable
            {...selectProps}
        />
    );
};
