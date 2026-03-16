import { useState } from 'react';

import { Translation } from '@suite/intl';
import { Button, Column, Modal } from '@trezor/components';
import { StepCard } from '@trezor/product-components';

import { openSystemSettingsThunk } from 'src/actions/bluetooth/openSystemSettingsThunk';
import { TrezorLink } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

export const OsAndTrezorCleanupModal = ({
    onCancel,
    onTrezorRemovalConfirm,
}: {
    onCancel: () => void;
    onTrezorRemovalConfirm: () => void;
}) => {
    const [osRemovalConfirmed, setOsRemovalConfirmed] = useState(false);
    const dispatch = useDispatch();

    const handleOpenBluetoothSettings = () => {
        dispatch(openSystemSettingsThunk({ type: 'bluetooth' }));
    };

    return (
        <Modal
            onCancel={onCancel}
            heading={<Translation id="TR_FORGET_DEVICE_MODAL_FINISH_HEADING" />}
            width={600}
        >
            <Column gap={16}>
                <StepCard
                    descriptionTypographyStyle="inherit"
                    heading={<Translation id="TR_FORGET_DEVICE_MODAL_ON_YOUR_COMPUTER" />}
                    description={
                        <Translation
                            id="TR_FORGET_DEVICE_MODAL_REMOVE_FROM_OS"
                            values={{
                                b: chunks => <b>{chunks}</b>,
                                link: chunks => (
                                    <TrezorLink
                                        onClick={event => {
                                            event.preventDefault();
                                            handleOpenBluetoothSettings();
                                        }}
                                    >
                                        {chunks}
                                    </TrezorLink>
                                ),
                            }}
                        />
                    }
                    actions={
                        <Button
                            intent="brand"
                            onClick={() => setOsRemovalConfirmed(true)}
                            size="large"
                            data-testid="@settings/device/ive-removed-it-button"
                        >
                            <Translation id="TR_FORGET_DEVICE_MODAL_IVE_REMOVED_IT" />
                        </Button>
                    }
                    icon="laptop"
                    state={osRemovalConfirmed ? 'confirmed' : 'default'}
                />
                <StepCard
                    descriptionTypographyStyle="inherit"
                    heading={<Translation id="TR_FORGET_DEVICE_MODAL_ON_YOUR_TREZOR" />}
                    description={
                        <Translation
                            id="TR_FORGET_DEVICE_MODAL_REMOVE_FROM_TREZOR"
                            values={{
                                b: chunks => <b>{chunks}</b>,
                            }}
                        />
                    }
                    actions={
                        <Button
                            intent="brand"
                            onClick={onTrezorRemovalConfirm}
                            size="large"
                            data-testid="@settings/device/ive-removed-it-button-trezor"
                        >
                            <Translation id="TR_FORGET_DEVICE_MODAL_IVE_REMOVED_IT" />
                        </Button>
                    }
                    icon="trezorSafe7"
                    state={osRemovalConfirmed ? 'default' : 'pending'}
                />
            </Column>
        </Modal>
    );
};
