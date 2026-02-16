import { ReactNode } from 'react';

import { Account } from '@suite-common/wallet-types';
import { Address } from '@trezor/blockchain-link-types';
import { Card, Column, Divider, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

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
        <Column gap={spacings.sm}>
            <Text typographyStyle="body" intent="neutral" priority="secondary">
                {title}
            </Text>

            <Card paddingType="none">
                {addresses.map((address, index) => (
                    <>
                        <TradingUtxoReceiveAddressOption account={account} address={address} />
                        {index < addresses.length - 1 && <Divider margin={0} />}
                    </>
                ))}
            </Card>
        </Column>
    );
};
