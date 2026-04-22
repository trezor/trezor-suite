import { useState } from 'react';

import { isFulfilled } from '@reduxjs/toolkit';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { wipeDeviceThunk } from '@suite-common/wallet-core';
import { Button, Column, Modal } from '@trezor/components';
import { isDeviceInBootloaderMode } from '@trezor/device-utils';
import { StepCard } from '@trezor/product-components';

import { useDispatch } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

type WipeDeviceModalProps = {
    onCancel: () => void;
};

export const WipeDeviceModal = ({ onCancel }: WipeDeviceModalProps) => {
    const analytics = useAnalytics();
    const [isLoading, setIsLoading] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);

    const { device, isLocked } = useDevice();
    const dispatch = useDispatch();

    const isBootloaderMode = isDeviceInBootloaderMode(device);

    const handleWipeDevice = async () => {
        setIsLoading(true);
        const response = await dispatch(wipeDeviceThunk());

        if (isFulfilled(response)) {
            analytics.report({
                type: events.settingsDeviceWipeEvent.name,
            });
            onCancel();
        }

        setIsLoading(false);
    };

    const handleCancel = () => {
        setIsLoading(false);
        onCancel();
    };

    const headingTranslation = isBootloaderMode
        ? 'TR_DEVICE_SETTINGS_FACTORY_RESET'
        : 'TR_DEVICE_SETTINGS_WIPE_DEVICE';

    return (
        <Modal
            onCancel={handleCancel}
            heading={<Translation id={headingTranslation} />}
            description={<Translation id="TR_WIPE_DEVICE_MODAL_PROCEED_WITH_CAUTION" />}
            intent="critical"
            width={600}
        >
            <Column gap={16}>
                <StepCard
                    heading={<Translation id="TR_WIPE_DEVICE_ERASE_ALL_DATA" />}
                    description={<Translation id="TR_WIPE_DEVICE_ERASE_ALL_DATA_DESCRIPTION" />}
                    actions={
                        <>
                            <Button
                                intent="critical"
                                onClick={() => setIsConfirmed(true)}
                                isLoading={isLoading}
                                isDisabled={isLocked()}
                                data-testid="@wipe/wipe-button"
                                size="large"
                            >
                                <Translation id="TR_I_UNDERSTAND_THE_RISK" />
                            </Button>

                            <Button
                                intent="neutral"
                                priority="secondary"
                                size="large"
                                onClick={handleCancel}
                            >
                                <Translation id="TR_GO_BACK" />
                            </Button>
                        </>
                    }
                    icon="trash"
                    state={isConfirmed ? 'confirmed' : 'default'}
                />
                <StepCard
                    heading={<Translation id="TR_WIPE_DEVICE_WALLET_BACKUP" />}
                    description={<Translation id="TR_WIPE_DEVICE_WALLET_BACKUP_DESCRIPTION" />}
                    actions={
                        <>
                            <Button
                                intent="critical"
                                onClick={handleWipeDevice}
                                isLoading={isLoading}
                                isDisabled={isLocked()}
                                data-testid="@wipe/wipe-button"
                                size="large"
                            >
                                <Translation id="TR_I_UNDERSTAND_THE_RISK" />
                            </Button>
                            <Button
                                intent="neutral"
                                priority="secondary"
                                onClick={() => setIsConfirmed(false)}
                                size="large"
                            >
                                <Translation id="TR_GO_BACK" />
                            </Button>
                        </>
                    }
                    icon="newspaper"
                    state={isConfirmed ? 'default' : 'pending'}
                />
            </Column>
        </Modal>
    );
};
