import { useState } from 'react';

import { selectSelectedDevice } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { getUnusedAddressFromAccount } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { isUtxoBased } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';

import { ReceiveAccountModal } from './ReceiveAccountModal';
import { UtxoReceiveAddressModal } from './UtxoReceiveAddressModal';

interface ReceiveAddressModalProps {
    symbol: NetworkSymbol;
    onAddressSelect: (address: string) => void;
    onClose: () => void;
}

export const ReceiveAddressModal = ({
    symbol,
    onAddressSelect,
    onClose,
}: ReceiveAddressModalProps) => {
    const activeWallet = useSelector(selectSelectedDevice);

    const [utxoAccount, setUtxoAccount] = useState<Account | null>(null);
    const [wallet, setWallet] = useState<TrezorDevice | undefined>(activeWallet);

    const handleOnAddressSelect = (address: string) => {
        onAddressSelect(address);
        onClose();
    };

    const onAccountSelect = (account: Account) => {
        const isUtxoBasedNetwork = isUtxoBased(account);

        if (isUtxoBasedNetwork) {
            setUtxoAccount(account);
        } else {
            const { address } = getUnusedAddressFromAccount(account);
            if (!address) return;
            handleOnAddressSelect(address);
        }
    };

    if (utxoAccount) {
        return (
            <UtxoReceiveAddressModal
                account={utxoAccount}
                onAddressSelect={handleOnAddressSelect}
                onCancel={onClose}
                onBackClick={() => setUtxoAccount(null)}
            />
        );
    }

    return (
        <ReceiveAccountModal
            symbol={symbol}
            onAccountSelect={onAccountSelect}
            onClose={onClose}
            selectedWallet={wallet}
            onSelectWallet={setWallet}
        />
    );
};
