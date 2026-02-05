import { useSelector } from 'react-redux';

import { SuiteSyncDataRootState, selectSuiteSyncOutputLabel } from '@suite-common/suite-sync';
import { Text } from '@suite-native/atoms';
import type { StaticSessionId } from '@trezor/connect';

import { selectIsLabellingAllowed } from '../selectors';

type TransactionOutputLabelProps = {
    txId: string;
    outputIndex: string;
    deviceStaticSessionId: StaticSessionId;
};

export const TransactionOutputLabel = ({
    txId,
    outputIndex,
    deviceStaticSessionId,
}: TransactionOutputLabelProps) => {
    const isLabellingAllowed = useSelector(selectIsLabellingAllowed);

    const label = useSelector((state: SuiteSyncDataRootState) =>
        selectSuiteSyncOutputLabel(state, txId, outputIndex, deviceStaticSessionId),
    );

    return isLabellingAllowed ? <Text>{label}</Text> : null;
};
