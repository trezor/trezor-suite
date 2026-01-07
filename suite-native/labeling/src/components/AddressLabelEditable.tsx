import { useSelector } from 'react-redux';

import { WithLabelingState, selectAddressLabel } from '@suite-common/suite-sync';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountDescriptor } from '@suite-common/wallet-types';
import { useNativeServices } from '@suite-native/services';
import type { StaticSessionId } from '@trezor/connect';

import { EditableLabelLayout } from './EditableLabelLayout';
import { LabelEditForm } from './LabelEditForm';
import { selectIsLabelingEnabled } from '../selectors';

type AddressLabelEditableProps = {
    address: string;
    deviceStaticSessionId: StaticSessionId;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
};

export const AddressLabelEditable = ({
    address,
    deviceStaticSessionId,
    accountDescriptor,
    networkSymbol,
}: AddressLabelEditableProps) => {
    const isLabelingEnabled = useSelector(selectIsLabelingEnabled);
    const { suiteSync } = useNativeServices();

    const label = useSelector((state: WithLabelingState) =>
        selectAddressLabel({
            state,
            address,
            deviceStaticSessionId,
        }),
    );

    const onSubmit = (newLabel: string) => {
        suiteSync.labeling.updateAddressLabel({
            deviceStaticSessionId,
            address,
            label: newLabel,
            accountDescriptor,
            networkSymbol,
        });
    };

    if (!isLabelingEnabled) {
        return null;
    }

    return (
        <EditableLabelLayout label={label}>
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
