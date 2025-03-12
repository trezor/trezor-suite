import { Card, Spinner } from '@trezor/components';

import { BluetoothDialogCard } from './BluetoothDialogCard';
import { Translation } from '../Translation';

export const BluetoothLoading = () => (
    <BluetoothDialogCard
        cardHeader={<Translation id="TR_LOADING" />}
        floatingHeader={<Translation id="TR_CONNECT_VIA_BLUETOOTH" />}
    >
        <Card>
            <Spinner size={32} />
        </Card>
    </BluetoothDialogCard>
);
