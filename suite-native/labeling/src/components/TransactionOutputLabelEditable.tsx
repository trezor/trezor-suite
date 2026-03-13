import { useDispatch, useSelector } from 'react-redux';

import { type SuiteSyncDataRootState, selectSuiteSyncOutputLabel } from '@suite-common/suite-sync';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { isTokenTargetId } from '@suite-common/wallet-core';
import { type AccountDescriptor, type TxTargetId } from '@suite-common/wallet-types';
import { featureUsed } from '@suite-native/experimental-features';
import { useNativeServices } from '@suite-native/services';
import type { StaticSessionId } from '@trezor/connect';

import { EditableLabelLayout } from './EditableLabelLayout';
import { LabelEditForm } from './LabelEditForm';
import { useSuiteSyncErrorHandler } from '../hooks/useSuiteSyncLabelErrorHandler';
import { selectIsLabellingAllowed } from '../selectors';

type TransactionOutputLabelEditableProps = {
    txId: string;
    txTargetId: TxTargetId;
    deviceStaticSessionId: StaticSessionId;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
};

export const TransactionOutputLabelEditable = ({
    txId,
    txTargetId,
    deviceStaticSessionId,
    accountDescriptor,
    networkSymbol,
}: TransactionOutputLabelEditableProps) => {
    const dispatch = useDispatch();
    const isLabellingAllowed = useSelector(selectIsLabellingAllowed);
    const { suiteSync } = useNativeServices();
    const { handleSuiteSyncError } = useSuiteSyncErrorHandler();
    const isTokenTxTargetId = isTokenTargetId(txTargetId);

    const label = useSelector((state: SuiteSyncDataRootState) =>
        selectSuiteSyncOutputLabel(state, txId, txTargetId, deviceStaticSessionId),
    );

    // Tokens labels wouldn't sync properly between desktop & mobile, so labeling is turned off for tokens until it's fixed.
    if (!isLabellingAllowed || isTokenTxTargetId) {
        return null;
    }

    const onSubmit = async (value: string) => {
        const result = await suiteSync.labeling.updateOutputLabel({
            deviceStaticSessionId,
            txId,
            txTargetId,
            label: value,
            accountDescriptor,
            networkSymbol,
        });

        if (!result.success) {
            handleSuiteSyncError(result.error);

            return;
        }

        dispatch(featureUsed('suite-sync'));
    };

    return (
        <EditableLabelLayout
            label={label}
            testID={`@transactions/output-label/${txId}/${txTargetId}`}
        >
            {({ onClose }) => (
                <LabelEditForm
                    label={label ?? ''}
                    onSubmit={value => {
                        onSubmit(value);
                        onClose();
                    }}
                />
            )}
        </EditableLabelLayout>
    );
};
