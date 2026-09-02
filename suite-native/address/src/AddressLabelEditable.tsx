import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import { type SuiteSyncDataRootState, selectSuiteSyncAddressLabel } from '@suite-common/suite-sync';
import { selectUpdateAddressLabelDep } from '@suite-common/suite-sync-types';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountDescriptor } from '@suite-common/wallet-types';
import { featureUsed } from '@suite-native/feature-feedback';
import {
    EditableLabelLayout,
    LabelEditForm,
    selectIsLabellingAllowed,
} from '@suite-native/labeling';
import { useSuiteSyncErrorHandler } from '@suite-native/suite-sync';
import type { StaticSessionId } from '@trezor/connect';

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

    const { updateAddressLabel } = useServices(selectUpdateAddressLabelDep);

    const { handleSuiteSyncError } = useSuiteSyncErrorHandler();

    const label = useSelector((state: SuiteSyncDataRootState) =>
        selectSuiteSyncAddressLabel(state, deviceStaticSessionId, address),
    );

    const onSubmit = async (newLabel: string) => {
        const result = await updateAddressLabel({
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
