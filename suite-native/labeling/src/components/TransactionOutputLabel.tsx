import { useSelector } from 'react-redux';

import { WithLabelingState, selectOutputLabel } from '@suite-common/local-first-storage';
import { Text } from '@suite-native/atoms';
import type { StaticSessionId } from '@trezor/connect';

import { useIsLabelingEnabled } from './useIsLabelingEnabled';

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
    const isLabelingEnabled = useIsLabelingEnabled();

    const label =
        useSelector((state: WithLabelingState) =>
            selectOutputLabel({
                state,
                txId,
                outputIndex,
                deviceStaticSessionId,
            }),
        )?.label ?? null;

    if (!isLabelingEnabled) {
        return null;
    }

    return <Text>{label}</Text>;
};
