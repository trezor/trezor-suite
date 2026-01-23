import { useSelector } from 'react-redux';

import { SuiteSyncDataRootState, selectSuiteSyncOutputLabel } from '@suite-common/suite-sync';
import { Text } from '@suite-native/atoms';
import type { StaticSessionId } from '@trezor/connect';

import { selectSuiteSyncLabelingEnabled } from '../selectors';

type TransactionOutputLabelProps = {
    txId: string;
    outputIndex: number;
    deviceStaticSessionId: StaticSessionId;
};

export const TransactionOutputLabel = ({
    txId,
    outputIndex,
    deviceStaticSessionId,
}: TransactionOutputLabelProps) => {
    const isLabelingEnabled = useSelector(selectSuiteSyncLabelingEnabled);

    const label = useSelector((state: SuiteSyncDataRootState) =>
        selectSuiteSyncOutputLabel(state, txId, outputIndex, deviceStaticSessionId),
    );

    return isLabelingEnabled ? <Text>{label}</Text> : null;
};
