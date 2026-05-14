import { useDispatch, useSelector } from 'react-redux';

import { type SuiteSyncDataRootState, selectSuiteSyncAddressLabel } from '@suite-common/suite-sync';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountDescriptor } from '@suite-common/wallet-types';
import { featureUsed } from '@suite-native/feature-feedback';
import { useNativeServices } from '@suite-native/services';
import type { StaticSessionId } from '@trezor/connect';

import { EditableLabelLayout } from './EditableLabelLayout';
import { LabelEditForm } from './LabelEditForm';
import { useSuiteSyncErrorHandler } from '../hooks/useSuiteSyncLabelErrorHandler';
import { selectIsLabellingAllowed } from '../selectors';

type AddressLabelEditableProps = {
    address: string;
    deviceStaticSessionId: StaticSessionId;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
    testID?: string;
};

export const AddressLabelEditable = ({
    address,
    deviceStaticSessionId,
    accountDescriptor,
    networkSymbol,
    testID,
}: AddressLabelEditableProps) => {
    const dispatch = useDispatch();
    const isLabellingAllowed = useSelector(selectIsLabellingAllowed);
    const { suiteSync } = useNativeServices();
    const { handleSuiteSyncError } = useSuiteSyncErrorHandler();

    const label = useSelector((state: SuiteSyncDataRootState) =>
        selectSuiteSyncAddressLabel(state, deviceStaticSessionId, address),
    );

    const onSubmit = async (newLabel: string) => {
        const result = await suiteSync.labeling.updateAddressLabel({
            deviceStaticSessionId,
            address,
            label: newLabel,
            accountDescriptor,
            networkSymbol,
        });

        if (!result.success) {
            handleSuiteSyncError(result.error);

            return;
        }

        dispatch(featureUsed('suite-sync'));
    };

    if (!isLabellingAllowed) return null;

    return (
        <EditableLabelLayout label={label} testID={testID}>
            {({ onClose }) => (
                <LabelEditForm
                    label={label ?? ''}
                    onSubmit={newLabel => {
                        onSubmit(newLabel);
                        onClose();
                    }}
                />
            )}
        </EditableLabelLayout>
    );
};
