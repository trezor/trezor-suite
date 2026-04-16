import type { NetworkSymbol } from '@suite-common/wallet-config';
import { findAccountsByAddress } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';

import { AccountLabeling } from './AccountLabeling';
import { Address } from '../Address';

type AddressLabelingProps = {
    symbol: NetworkSymbol;
    address?: string | null;
    knownOnly?: boolean;
};

export const AddressLabeling = ({ symbol, address, knownOnly }: AddressLabelingProps) => {
    const accounts = useSelector(state => state.wallet.accounts);

    if (!address || !symbol) {
        return null;
    }

    const relevantAccounts = findAccountsByAddress(symbol, address, accounts);

    if (relevantAccounts.length < 1) {
        return !knownOnly ? <Address value={address} isTruncated /> : null;
    }

    const firstAccount = relevantAccounts[0];

    if (!firstAccount) {
        return !knownOnly ? <Address value={address} isTruncated /> : null;
    }

    return (
        <AccountLabeling account={firstAccount} accountTypeBadgeSize="small" showAccountTypeBadge />
    );
};
