import React from 'react';

import { Translation } from 'src/components/suite';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from 'src/components/suite/Settings';
import { useActions } from 'src/hooks/suite';
import * as modalActions from 'src/actions/suite/modalActions';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

interface WipeDeviceProps {
    isDeviceLocked: boolean;
}

export const WipeDevice = ({ isDeviceLocked }: WipeDeviceProps) => {
    const { openModal } = useActions({
        openModal: modalActions.openModal,
    });
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.WipeDevice);

    return (
        <SectionItem
            data-test="@settings/device/wipe-device"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_BUTTON_WIPE_DEVICE" />}
                description={<Translation id="TR_WIPING_YOUR_DEVICE" />}
            />
            <ActionColumn>
                <ActionButton
                    onClick={() =>
                        openModal({
                            type: 'wipe-device',
                        })
                    }
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
