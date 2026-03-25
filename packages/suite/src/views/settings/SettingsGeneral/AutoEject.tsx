import { useState } from 'react';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { selectDevices } from '@suite-common/device';
import { selectIsDeviceAutoEjectEnabled } from '@suite-common/wallet-core';
import { Modal, Switch } from '@trezor/components';
import { ActionColumn, TextColumn } from '@trezor/product-components';

import { setAutoEjectEnabledThunk } from 'src/actions/suite/autoEjectThunks';
import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

const AutoEjectConfirmationModal = ({
    onCancel,
    onSubmit,
}: {
    onCancel: () => void;
    onSubmit: () => void;
}) => {
    const handleConfirmClick = () => {
        onSubmit();
        onCancel();
    };

    return (
        <Modal
            heading={<Translation id="TR_AUTO_EJECT_CONFIRMATION_TITLE" />}
            onCancel={onCancel}
            width={600}
            bottomContent={
                <>
                    <Modal.Button onClick={handleConfirmClick} data-testid="@log/export-button">
                        <Translation id="TR_CONFIRM_AUTO_EJECT" />
                    </Modal.Button>
                    <Modal.Button onClick={onCancel} intent="neutral" priority="secondary">
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <Translation id="TR_AUTO_EJECT_CONFIRMATION_DESCRIPTION" />
        </Modal>
    );
};

export const AutoEject = () => {
    const analytics = useAnalytics();
    const isAutoEjectEnabled = useSelector(selectIsDeviceAutoEjectEnabled);
    const dispatch = useDispatch();
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

    const devices = useSelector(selectDevices);

    const hasAnyDisconnectedWallet = devices.some(device => !device.connected && device.state);

    const toggleAutoEject = () => {
        dispatch(
            setAutoEjectEnabledThunk({
                shouldEnable: !isAutoEjectEnabled,
            }),
        );

        analytics.report({
            type: events.settingsGeneralAutoEjectEvent.name,
            payload: {
                value: !isAutoEjectEnabled,
            },
        });
    };

    const handleSubmit = () => {
        if (!isAutoEjectEnabled && hasAnyDisconnectedWallet) {
            setIsConfirmationModalOpen(true);
        } else {
            toggleAutoEject();
        }
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.AutoEject}>
            <TextColumn
                title={<Translation id="TR_AUTO_EJECT" />}
                description={<Translation id="TR_AUTO_EJECT_DESCRIPTION" />}
            />
            <ActionColumn>
                <Switch
                    isChecked={isAutoEjectEnabled}
                    onChange={handleSubmit}
                    data-testid="@settings/auto-eject-switch"
                />
            </ActionColumn>
            {isConfirmationModalOpen && (
                <AutoEjectConfirmationModal
                    onCancel={() => setIsConfirmationModalOpen(false)}
                    onSubmit={toggleAutoEject}
                />
            )}
        </SettingsSectionItem>
    );
};
