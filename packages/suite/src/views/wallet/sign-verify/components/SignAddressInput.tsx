import { Address } from '@suite/address';
import { type ReceiveInfo } from '@suite-common/wallet-types';
import { Box, Row, Select, type SelectProps, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import {
    type AddressItem,
    useSignAddressOptions,
} from 'src/hooks/wallet/sign-verify/useSignAddressOptions';
import type { Account } from 'src/types/wallet';

const optionToAddress = (option: AddressItem | null) =>
    option ? { address: option.label, path: option.value } : null;

const formatOptionLabel = (option: AddressItem) => (
    <Row gap={spacings.xxs}>
        <Box minWidth={36}>
            <Text isDisabled>/{option.value.split('/').pop()}</Text>
        </Box>
        <Address value={option.label} isTruncated />
    </Row>
);

type SignAddressInputProps = {
    account?: Account;
    revealedAddresses: ReceiveInfo[];
} & SelectProps;

export const SignAddressInput = ({
    account,
    revealedAddresses,
    value,
    onChange,
    ...selectProps
}: SignAddressInputProps) => {
    const { getValue, groupedOptions } = useSignAddressOptions(account, revealedAddresses);

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
