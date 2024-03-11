import { findAccountsByAddress } from '@suite-common/wallet-utils';
import { useSelector } from 'src/hooks/suite';
import { AccountLabeling } from './AccountLabeling';
import { NetworkSymbol } from '@suite-common/wallet-config';

interface AddressLabelingProps {
    networkSymbol: NetworkSymbol;
    address?: string | null;
    knownOnly?: boolean;
}

export const AddressLabeling = ({ networkSymbol, address, knownOnly }: AddressLabelingProps) => {
    const accounts = useSelector(state => state.wallet.accounts);

    if (!address || !networkSymbol) {
        return null;
    }

    const relevantAccounts = findAccountsByAddress(networkSymbol, address, accounts);

    if (relevantAccounts.length < 1) {
        return !knownOnly ? <span>{address}</span> : null;
    }

    return <AccountLabeling account={relevantAccounts[0]} />;
};
