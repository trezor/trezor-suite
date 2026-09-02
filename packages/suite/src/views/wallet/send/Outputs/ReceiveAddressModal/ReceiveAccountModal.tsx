import { selectPhysicalDeviceWallets, selectSelectedDevice } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Badge, Column, Modal, Row, Select } from '@trezor/components';

import { WalletLabeling } from 'src/components/suite/labeling/WalletLabeling';
import { useSelector } from 'src/hooks/suite';

import { ReceiveAccountModalAccountsList } from './ReceiveAccountModalAccountsList';

interface ReceiveAccountModalProps {
    symbol: NetworkSymbol;
    onAccountSelect: (account: Account) => void;
    onClose: () => void;
    selectedWallet?: TrezorDevice;
    onSelectWallet: (wallet?: TrezorDevice) => void;
}

export const ReceiveAccountModal = ({
    symbol,
    onAccountSelect,
    onClose,
    selectedWallet,
    onSelectWallet,
}: ReceiveAccountModalProps) => {
    const wallets = useSelector(selectPhysicalDeviceWallets);
    const activeWallet = useSelector(selectSelectedDevice);

    return (
        <Modal heading="Receive account" onCancel={onClose} width={600}>
            <Column gap={12}>
                <Select
                    options={wallets}
                    value={selectedWallet}
                    onChange={onSelectWallet}
                    formatOptionLabel={wallet => (
                        <Row alignItems="center" gap={12}>
                            <WalletLabeling device={wallet} shouldUseDeviceLabel />
                            {wallet.state?.staticSessionId ===
                                activeWallet?.state?.staticSessionId && (
                                <Badge intent="accentViolet">Current wallet</Badge>
                            )}
                        </Row>
                    )}
                />

                {selectedWallet && (
                    <ReceiveAccountModalAccountsList
                        wallet={selectedWallet}
                        symbol={symbol}
                        onAccountSelect={onAccountSelect}
                    />
                )}
            </Column>
        </Modal>
    );
};
