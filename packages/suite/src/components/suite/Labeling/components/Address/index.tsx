import React from 'react';
import * as accountUtils from '@wallet-utils/accountUtils';
import { useSelector } from '@suite-hooks';
import AccountLabel from '../Account';

// DeviceLabel? / WalletLabel? / Account #N / AccountType?

interface Props {
    address?: string | null;
    knownOnly?: boolean;
}

const Address = ({ address, knownOnly }: Props) => {
    const accounts = useSelector(state => state.wallet.accounts);

    if (!address) return null;

    const found = accountUtils.findAccountsByAddress(address, accounts);
    if (found.length < 1) return !knownOnly ? <span>{address}</span> : null;

    return <AccountLabel account={found[0]} />;
};

export default Address;
