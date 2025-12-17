import { useState } from 'react';

import { EventType } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { selectDevices, selectIsDeviceAutoEjectEnabled } from '@suite-common/wallet-core';
import { Modal, Switch } from '@trezor/components';

import { setAutoEjectEnabledThunk } from 'src/actions/suite/autoEjectThunks';
import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { ActionColumn, TextColumn } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useLegacyAnalytics } from 'src/support/useAnalytics';

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
    const legacyAnalytics = useLegacyAnalytics();
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

        legacyAnalytics.report({
            type: EventType.SettingsGeneralAutoEject,
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
