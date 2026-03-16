import { type ReactNode } from 'react';

import { type Account } from '@suite-common/wallet-types';
import { type Address } from '@trezor/blockchain-link-types';
import { CardList, Column, Text } from '@trezor/components';

import { TradingUtxoReceiveAddressOption } from './TradingUtxoReceiveAddressOption';

interface TradingUtxoReceiveAddressListProps {
    addresses: Address[];
    title: ReactNode;
    account: Account;
}

export const TradingUtxoReceiveAddressList = ({
    addresses,
    title,
    account,
}: TradingUtxoReceiveAddressListProps) => {
    if (addresses.length === 0) return null;

    return (
        <Column gap={12}>
            <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                {title}
            </Text>

            <CardList>
                {addresses.map(address => (
                    <TradingUtxoReceiveAddressOption
                        key={address.address}
                        account={account}
                        address={address}
                    />
                ))}
            </CardList>
        </Column>
    );
};
