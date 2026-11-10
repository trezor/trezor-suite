import { Address } from '@suite/address';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { selectAccounts } from '@suite-common/wallet-core';
import { findAccountsByAddress } from '@suite-common/wallet-utils';

import { AccountLabeling } from './AccountLabeling';
import { useSelector } from '../../../hooks/suite';

type AddressLabelingProps = {
    symbol: NetworkSymbol;
    address?: string | null;
    knownOnly?: boolean;
};

export const AccountLabelForOwnAddress = ({ symbol, address, knownOnly }: AddressLabelingProps) => {
    const accounts = useSelector(selectAccounts);

    if (!address || !symbol) {
        return null;
    }

    const relevantAccounts = findAccountsByAddress(symbol, address, accounts);

    const firstAccount = relevantAccounts[0];

    if (!firstAccount) {
        return !knownOnly ? <Address value={address} isTruncated /> : null;
    }

    return (
        <AccountLabeling account={firstAccount} accountTypeBadgeSize="small" showAccountTypeBadge />
    );
};
