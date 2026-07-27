import { useDispatch, useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { type SuiteSyncDataRootState, selectSuiteSyncOutputLabel } from '@suite-common/suite-sync';
import { selectUpdateOutputLabelDep } from '@suite-common/suite-sync-types';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { isTokenTargetId } from '@suite-common/wallet-core';
import { type AccountDescriptor, type TxTargetId } from '@suite-common/wallet-types';
import { featureUsed } from '@suite-native/feature-feedback';
import {
    EditableLabelLayout,
    LabelEditForm,
    selectIsLabellingAllowed,
} from '@suite-native/labeling';
import { useSuiteSyncErrorHandler } from '@suite-native/suite-sync';
import type { StaticSessionId } from '@trezor/connect';

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

    const { updateOutputLabel } = useServices(selectUpdateOutputLabelDep);

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
        const result = await updateOutputLabel({
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
