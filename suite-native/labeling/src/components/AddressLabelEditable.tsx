import { useDispatch, useSelector } from 'react-redux';

import {
    WithLabelingState,
    selectAddressLabel,
    updateAddressLabelThunk,
} from '@suite-common/local-first-storage';
import type { StaticSessionId } from '@trezor/connect';

import { EditableLabelLayout } from './EditableLabelLayout';
import { LabelEditForm } from './LabelEditForm';

type AddressLabelEditableProps = {
    address: string;
    deviceStaticSessionId: StaticSessionId;
};

export const AddressLabelEditable = ({
    address,
    deviceStaticSessionId,
}: AddressLabelEditableProps) => {
    const dispatch = useDispatch();

    const label = useSelector(
        (state: WithLabelingState) =>
            (address !== undefined
                ? selectAddressLabel({
                      state,
                      address,
                      deviceStaticSessionId,
                  })
                : null
            )?.label ?? null,
    );

    return (
        <EditableLabelLayout label={label} justifyContent="center">
            {({ onClose }) => (
                <LabelEditForm
                    label={label ?? ''}
                    onSubmit={value => {
                        dispatch(
                            updateAddressLabelThunk({
                                deviceStaticSessionId,
                                address,
                                label: value,
                            }),
                        );
                        onClose();
                    }}
                />
            )}
        </EditableLabelLayout>
    );
};
