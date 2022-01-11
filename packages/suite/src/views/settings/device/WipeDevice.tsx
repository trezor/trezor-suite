import React from 'react';
import { Translation } from '@suite-components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { useAnalytics, useActions } from '@suite-hooks';
import * as modalActions from '@suite-actions/modalActions';

interface Props {
    isDeviceLocked: boolean;
}

const WipeDevice = ({ isDeviceLocked }: Props) => {
    const { openModal } = useActions({
        openModal: modalActions.openModal,
    });
    const analytics = useAnalytics();

    return (
        <SectionItem>
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_BUTTON_WIPE_DEVICE" />}
                description={<Translation id="TR_WIPING_YOUR_DEVICE" />}
            />
            <ActionColumn>
                <ActionButton
                    onClick={() => {
                        openModal({
                            type: 'wipe-device',
                        });
                        analytics.report({
                            type: 'settings/device/goto/wipe',
                        });
                    }}
                    variant="danger"
                    isDisabled={isDeviceLocked}
                    data-test="@settings/device/open-wipe-modal-button"
                >
                    <Translation id="TR_DEVICE_SETTINGS_BUTTON_WIPE_DEVICE" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
export default WipeDevice;
