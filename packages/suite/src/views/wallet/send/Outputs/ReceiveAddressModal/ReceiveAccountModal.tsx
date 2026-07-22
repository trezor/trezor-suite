import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectDeviceAccountsByNetworkSymbol } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { CardList, Column, Modal } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { ReceiveAccountItem } from './ReceiveAccountItem';

interface ReceiveAccountModalProps {
    symbol: NetworkSymbol;
    onAccountSelect: (account: Account) => void;
    onClose: () => void;
}

export const ReceiveAccountModal = ({
    symbol,
    onAccountSelect,
    onClose,
}: ReceiveAccountModalProps) => {
    const accounts = useSelector(state => selectDeviceAccountsByNetworkSymbol(state, symbol));

    return (
        <Modal heading="Receive account" onCancel={onClose} width={600}>
            <Column gap={12}>
                <CardList>
                    {accounts.map(account => (
                        <ReceiveAccountItem
                            key={account.key}
                            account={account}
                            onAccountSelect={onAccountSelect}
                        />
                    ))}
                </CardList>
            </Column>
        </Modal>
    );
};
