import { useSelector } from 'react-redux';

import { type SuiteSyncDataRootState, selectSuiteSyncOutputLabel } from '@suite-common/suite-sync';
import { Text, type TextProps } from '@suite-native/atoms';
import type { StaticSessionId } from '@trezor/connect';

import { selectIsLabellingAllowed } from '../selectors';

type TransactionOutputLabelProps = TextProps & {
    txId: string;
    outputIndex: string;
    deviceStaticSessionId: StaticSessionId;
};

export const TransactionOutputLabel = ({
    txId,
    outputIndex,
    deviceStaticSessionId,
    ...textProps
}: TransactionOutputLabelProps) => {
    const isLabellingAllowed = useSelector(selectIsLabellingAllowed);

    const label = useSelector((state: SuiteSyncDataRootState) =>
        selectSuiteSyncOutputLabel(state, txId, outputIndex, deviceStaticSessionId),
    );

    if (!isLabellingAllowed || !label) {
        return null;
    }

    return (
        <Text numberOfLines={1} {...textProps}>
            {label}
        </Text>
    );
};
