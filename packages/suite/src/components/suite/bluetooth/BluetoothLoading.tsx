import { Card, Spinner } from '@trezor/components';

import { BluetoothDialogCard } from './BluetoothDialogCard';
import { Translation } from '../Translation';

type BluetoothLoadingProps = {
    onClose: () => void;
};

export const BluetoothLoading = ({ onClose }: BluetoothLoadingProps) => (
    <BluetoothDialogCard
        cardHeader={<Translation id="TR_LOADING" />}
        floatingHeader={<Translation id="TR_CONNECT_VIA_BLUETOOTH" />}
        headerOnClose={onClose}
    >
        <Card>
            <Spinner size={32} />
        </Card>
    </BluetoothDialogCard>
);
