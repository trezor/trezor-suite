import { useState } from 'react';

import { selectDevices, selectIsAutoForgetDeviceDataEnabled } from '@suite-common/wallet-core';
import { Modal, Switch, Tooltip } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';

import { setAutoEjectEnabledThunk } from 'src/actions/suite/autoEjectThunks';
import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsAutoEjectEnabled } from 'src/selectors/suite/suiteSelectors';

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
            size="small"
            bottomContent={
                <>
                    <Modal.Button onClick={handleConfirmClick} data-testid="@log/export-button">
                        <Translation id="TR_CONFIRM_AUTO_EJECT" />
                    </Modal.Button>
                    <Modal.Button onClick={onCancel} variant="tertiary">
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
    const isAutoEjectEnabled = useSelector(selectIsAutoEjectEnabled);
    const isAutoForgetDeviceDataEnabled = useSelector(selectIsAutoForgetDeviceDataEnabled);
    const dispatch = useDispatch();
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

    const devices = useSelector(selectDevices);

    const hasAnyDisconnectedWallet = devices.some(device => !device.connected && device.state);

    const toggleAutoEject = () => {
        const nextIsAutoEjectedEnabled = !isAutoEjectEnabled;
        dispatch(
            setAutoEjectEnabledThunk({
                enabled: nextIsAutoEjectedEnabled,
            }),
        );

        analytics.report({
            type: EventType.SettingsGeneralAutoEject,
            payload: {
                value: nextIsAutoEjectedEnabled,
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
                <Tooltip
                    isActive={isAutoForgetDeviceDataEnabled}
                    content={<Translation id="TR_AUTO_EJECT_FORCED_TOOLTIP" />}
                >
                    <Switch
                        isChecked={isAutoEjectEnabled}
                        isDisabled={isAutoForgetDeviceDataEnabled}
                        onChange={handleSubmit}
                        data-testid="@settings/auto-eject-switch"
                    />
                </Tooltip>
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
