import { ReactNode } from 'react';

import { Account } from '@suite-common/wallet-types';
import { Address } from '@trezor/blockchain-link-types';
import { Column, Text } from '@trezor/components';

import { TradingUtxoReceiveAddressOption } from './TradingUtxoReceiveAddressOption';

type TradingUtxoReceiveAddressListProps = {
    addresses: Address[];
    title: ReactNode;
    account: Account;
};

export const TradingUtxoReceiveAddressList = ({
    addresses,
    title,
    account,
}: TradingUtxoReceiveAddressListProps) => {
    if (addresses.length === 0) return null;

    return (
        <Column gap={8}>
            <Text variant="tertiary">{title}</Text>
            <Column gap={8}>
                {addresses.map(address => (
                    <TradingUtxoReceiveAddressOption
                        key={address.address}
                        account={account}
                        address={address}
                    />
                ))}
            </Column>
        </Column>
    );
};
