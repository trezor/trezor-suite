import { useSelector } from 'react-redux';

import type { NetworkSymbol } from '@suite-common/wallet-config';
import {
    TransactionsRootState,
    selectTransactionByAccountKeyAndTxid,
} from '@suite-common/wallet-core';
import { AccountDescriptor, AccountKey } from '@suite-common/wallet-types';
import { useNativeServices } from '@suite-native/services';
import type { StaticSessionId } from '@trezor/connect';

import { EditableLabelLayout } from './EditableLabelLayout';
import { LabelEditForm } from './LabelEditForm';
import { selectIsLabelingEnabled } from '../selectors';

type TransactionOutputLabelEditableProps = {
    txId: string;
    outputIndex: number;
    deviceStaticSessionId: StaticSessionId;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
};

export const TransactionOutputLabelEditable = ({
    txId,
    outputIndex,
    deviceStaticSessionId,
    accountDescriptor,
    networkSymbol,
}: TransactionOutputLabelEditableProps) => {
    const isLabelingEnabled = useSelector(selectIsLabelingEnabled);
    const { suiteSync } = useNativeServices();

    const accountKey: AccountKey = `${accountDescriptor}-${networkSymbol}-${deviceStaticSessionId}`;

    const transaction = useSelector((state: TransactionsRootState) =>
        selectTransactionByAccountKeyAndTxid(state, accountKey, txId),
    );

    const label = transaction?.targets.find(it => it.n === outputIndex)?.label ?? '';

    if (!isLabelingEnabled) {
        return null;
    }

    return (
        <EditableLabelLayout label={label}>
            {({ onClose }) => (
                <LabelEditForm
                    label={label ?? ''}
                    onSubmit={value => {
                        suiteSync.labeling.updateOutputLabel({
                            deviceStaticSessionId,
                            txId,
                            outputIndex,
                            label: value,
                            accountDescriptor,
                            networkSymbol,
                        });
                        onClose();
                    }}
                />
            )}
        </EditableLabelLayout>
    );
};
