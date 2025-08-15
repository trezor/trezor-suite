import { ReactNode } from 'react';

import { Card, Spinner } from '@trezor/components';

import { BluetoothDialogCard } from './BluetoothDialogCard';
import { Translation } from '../Translation';

type BluetoothLoadingProps = {
    floatingHeader?: ReactNode;
    onClose: () => void;
};

export const BluetoothLoading = ({ floatingHeader, onClose }: BluetoothLoadingProps) => (
    <BluetoothDialogCard
        cardHeader={<Translation id="TR_LOADING" />}
        floatingHeader={floatingHeader}
        headerOnClose={onClose}
    >
        <Card>
            <Spinner size={32} />
        </Card>
    </BluetoothDialogCard>
);
