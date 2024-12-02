import { findAccountsByAddress } from '@suite-common/wallet-utils';
import type { NetworkSymbol } from '@suite-common/wallet-config';

import { useSelector } from 'src/hooks/suite';

import { AccountLabeling } from './AccountLabeling';

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
        return !knownOnly ? <span>{address}</span> : null;
    }

    return (
        <AccountLabeling
            account={relevantAccounts[0]}
            accountTypeBadgeSize="small"
            showAccountTypeBadge
        />
    );
};
