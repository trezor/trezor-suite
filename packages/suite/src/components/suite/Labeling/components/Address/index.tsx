import React from 'react';
import * as accountUtils from '@wallet-utils/accountUtils';
import { Props } from './Container';
import AccountLabel from '../Account/Container';

// DeviceLabel? / WalletLabel? / Account #N / AccountType?

const Address = (props: Props) => {
    const { address } = props;
    if (!address) return null;

    const found = accountUtils.findAccountsByAddress(address, props.accounts);
    if (found.length < 1) return !props.knownOnly ? <span>{address}</span> : null;

    return <AccountLabel account={found[0]} />;
};

export default Address;
