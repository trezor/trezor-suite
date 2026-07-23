import { type ReactNode } from 'react';

import { type Account } from '@suite-common/wallet-types';
import { type Address as AddressType } from '@trezor/blockchain-link-types';
import { CardList, Column, Text } from '@trezor/components';

import { UtxoReceiveAddressOption } from './UtxoReceiveAddressOption';

interface UtxoReceiveAddressListProps {
    addresses: AddressType[];
    title: ReactNode;
    account: Account;
    onAddressSelect: (address: string) => void;
}

export const UtxoReceiveAddressList = ({
    addresses,
    title,
    account,
    onAddressSelect,
}: UtxoReceiveAddressListProps) => {
    if (addresses.length === 0) return null;

    return (
        <Column gap={12}>
            <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                {title}
            </Text>

            <CardList>
                {addresses.map(address => (
                    <UtxoReceiveAddressOption
                        key={address.address}
                        account={account}
                        address={address}
                        onAddressSelect={onAddressSelect}
                    />
                ))}
            </CardList>
        </Column>
    );
};
