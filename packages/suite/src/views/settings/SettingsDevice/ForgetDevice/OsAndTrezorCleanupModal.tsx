import { useState } from 'react';

import { openSystemSettingsThunk } from '@suite/bluetooth';
import { TrezorLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { Button, Column, Modal } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { LaptopIcon, TrezorSafe7Icon } from '@trezor/icons';
import { StepCard } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

type OsAndTrezorCleanupModalProps = {
    onCancel: () => void;
    onTrezorRemovalConfirm: () => void;
};

export const OsAndTrezorCleanupModal = ({
    onCancel,
    onTrezorRemovalConfirm,
}: OsAndTrezorCleanupModalProps) => {
    const [osRemovalConfirmed, setOsRemovalConfirmed] = useState(false);
    const { dispatch } = useServices(injectDispatch);

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
                    icon={LaptopIcon}
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
                    icon={TrezorSafe7Icon}
                    state={osRemovalConfirmed ? 'default' : 'pending'}
                />
            </Column>
        </Modal>
    );
};
