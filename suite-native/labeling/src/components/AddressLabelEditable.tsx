import { useSelector } from 'react-redux';

import type { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountsRootState, selectAccountLabel } from '@suite-common/wallet-core';
import { AccountDescriptor } from '@suite-common/wallet-types';
import { getAccountKey } from '@suite-common/wallet-utils';
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

    const accountKey = getAccountKey(accountDescriptor, networkSymbol, deviceStaticSessionId);

    const label = useSelector((state: AccountsRootState) => selectAccountLabel(state, accountKey));

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
