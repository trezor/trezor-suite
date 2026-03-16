import { useState } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { selectAdapterStatus } from '@suite-common/bluetooth';
import { Banner, Modal, Paragraph } from '@trezor/components';

import { openSystemSettingsThunk } from 'src/actions/bluetooth/openSystemSettingsThunk';
import { useDispatch, useSelector } from 'src/hooks/suite';

type BluetoothAdapterStatusModalProps = {
    onCancel: () => void;
};

type AdapterIssueSolution = {
    title: TranslationKey;
    description: TranslationKey;
    ctaText?: TranslationKey;
    onCtaClick?: () => void;
    deeplinkFailed?: TranslationKey;
};

export const BluetoothAdapterStatusModal = ({ onCancel }: BluetoothAdapterStatusModalProps) => {
    const bluetoothAdapterStatus = useSelector(selectAdapterStatus);

    const [hasDeeplinkFailed, setHasDeeplinkFailed] = useState(false);
    const dispatch = useDispatch();

    const openBluetoothSettings = async (settingsPage: 'bluetooth' | 'bluetooth-permissions') => {
        const result = await dispatch(openSystemSettingsThunk({ type: settingsPage })).unwrap();

        if (!result.success) {
            setHasDeeplinkFailed(true);
        }
    };
    const openBluetoothEnableSettings = () => {
        openBluetoothSettings('bluetooth');
    };
    const openBluetoothSecuritySettings = () => {
        openBluetoothSettings('bluetooth-permissions');
    };

    const statuses: Record<string, AdapterIssueSolution> = {
        disabled: {
            title: 'TR_BLUETOOTH_TURNED_OFF',
            description: 'TR_BLUETOOTH_TURNED_OFF_TEXT',
            ctaText: 'TR_TURN_ON_BLUETOOTH_CTA',
            onCtaClick: openBluetoothEnableSettings,
            deeplinkFailed: 'TR_BLUETOOTH_CANNOT_OPEN_BLUETOOTH_SETTINGS',
        },
        'permission-denied': {
            title: 'TR_BLUETOOTH_ALLOW_BLUETOOTH_PERMISSIONS',
            description: 'TR_BLUETOOTH_OR_CONNECT_VIA_CABLE',
            ctaText: 'TR_ALLOW_BLUETOOTH_CTA',
            onCtaClick: openBluetoothSecuritySettings,
            deeplinkFailed: 'TR_BLUETOOTH_CANNOT_OPEN_BLUETOOTH_SETTINGS_PERMISSIONS',
        },
        'not-compatible': {
            title: 'TR_BLUETOOTH_VERSION_NOT_COMPATIBLE_LINE1',
            description: 'TR_BLUETOOTH_VERSION_NOT_COMPATIBLE_LINE2',
        },
    };

    const status = statuses[bluetoothAdapterStatus];

    return (
        <Modal
            heading={<Translation id={status.title} />}
            width={600}
            onCancel={onCancel}
            bottomContent={
                <>
                    {status.ctaText && (
                        <Modal.Button isDisabled={hasDeeplinkFailed} onClick={status.onCtaClick}>
                            <Translation id={status.ctaText} />
                        </Modal.Button>
                    )}
                    <Modal.Button onClick={onCancel} intent="neutral" priority="secondary">
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            {hasDeeplinkFailed && status.deeplinkFailed ? (
                <Banner
                    intent="warning"
                    icon
                    description={<Translation id={status.deeplinkFailed} />}
                />
            ) : (
                <Paragraph>
                    <Translation id={status.description}></Translation>
                </Paragraph>
            )}
        </Modal>
    );
};
