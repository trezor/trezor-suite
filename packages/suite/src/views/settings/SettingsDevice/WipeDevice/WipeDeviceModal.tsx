import { useState } from 'react';

import { isFulfilled } from '@reduxjs/toolkit';

import { Translation } from '@suite/intl';
import { EventType } from '@suite-common/analytics-types';
import { wipeDeviceThunk } from '@suite-common/wallet-core';
import { Card, Column, H3, Modal, Paragraph } from '@trezor/components';
import { isDeviceInBootloaderMode } from '@trezor/device-utils';
import { spacings } from '@trezor/theme';

import * as routerActions from 'src/actions/suite/routerActions';
import { CheckItem } from 'src/components/suite';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { selectRouterApp } from 'src/reducers/suite/routerReducer';
import { useLegacyAnalytics } from 'src/support/useAnalytics';

type WipeDeviceModalProps = {
    onCancel: () => void;
};

export const WipeDeviceModal = ({ onCancel }: WipeDeviceModalProps) => {
    const legacyAnalytics = useLegacyAnalytics();
    const [checkbox1, setCheckbox1] = useState(false);
    const [checkbox2, setCheckbox2] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { device, isLocked } = useDevice();
    const dispatch = useDispatch();
    const appRoute = useSelector(selectRouterApp);

    const isBootloaderMode = isDeviceInBootloaderMode(device);

    const handleWipeDevice = async () => {
        setIsLoading(true);
        const response = await dispatch(wipeDeviceThunk());

        if (isFulfilled(response)) {
            legacyAnalytics.report({
                type: EventType.SettingsDeviceWipe,
            });
            if (appRoute === 'settings') {
                // redirect to the index to close the settings and show initial device setup
                dispatch(routerActions.goto('suite-index'));
            }
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
            variant="destructive"
            iconName="shieldWarning"
            width={600}
            bottomContent={
                <>
                    <Modal.Button
                        onClick={handleWipeDevice}
                        isLoading={isLoading}
                        isDisabled={isLocked() || !checkbox1 || !checkbox2}
                        data-testid="@wipe/wipe-button"
                    >
                        <Translation id={headingTranslation} />
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={handleCancel}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <H3>
                <Translation id={headingTranslation} />
            </H3>
            <Paragraph variant="tertiary" margin={{ top: spacings.xs }}>
                <Translation
                    id={
                        isBootloaderMode
                            ? 'TR_FACTORY_RESET_MODAL_DESCRIPTION'
                            : 'TR_WIPE_DEVICE_MODAL_DESCRIPTION'
                    }
                />
            </Paragraph>
            <Card margin={{ top: spacings.lg }}>
                <Column gap={spacings.md} alignItems="center">
                    <CheckItem
                        title={<Translation id="TR_WIPE_DEVICE_CHECKBOX_1_TITLE" />}
                        description={<Translation id="TR_WIPE_DEVICE_CHECKBOX_1_DESCRIPTION" />}
                        isChecked={checkbox1}
                        onClick={() => setCheckbox1(!checkbox1)}
                        data-testid="@wipe/checkbox-1"
                    />
                    <CheckItem
                        title={<Translation id="TR_WIPE_DEVICE_CHECKBOX_2_TITLE" />}
                        description={<Translation id="TR_WIPE_DEVICE_CHECKBOX_2_DESCRIPTION" />}
                        isChecked={checkbox2}
                        onClick={() => setCheckbox2(!checkbox2)}
                        data-testid="@wipe/checkbox-2"
                    />
                </Column>
            </Card>
        </Modal>
    );
};
