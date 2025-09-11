import { useState } from 'react';

import { TranslationKey } from '@suite-common/intl-types';
import { Banner, Modal, Paragraph } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';

import { Translation } from 'src/components/suite/Translation';

type BluetoothAdapterStatusModalProps = {
    bluetoothAdapterStatus: 'disabled' | 'permission-denied' | 'not-compatible';
    onCancel: () => void;
};

type AdapterIssueSolution = {
    title: TranslationKey;
    description: TranslationKey;
    ctaText?: TranslationKey;
    onCtaClick?: () => void;
    deeplinkFailed?: TranslationKey;
};

export const BluetoothAdapterStatusModal = ({
    bluetoothAdapterStatus,
    onCancel,
}: BluetoothAdapterStatusModalProps) => {
    const [hasDeeplinkFailed, setHasDeeplinkFailed] = useState(false);

    const openBluetoothSettings = async (settingsPage: 'bluetooth' | 'bluetooth-permissions') => {
        const opened = await desktopApi.openSystemSettings(settingsPage);
        if (!opened.success) {
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
            size="small"
            onCancel={onCancel}
            bottomContent={
                <>
                    {status.ctaText && (
                        <Modal.Button isDisabled={hasDeeplinkFailed} onClick={status.onCtaClick}>
                            <Translation id={status.ctaText} />
                        </Modal.Button>
                    )}
                    <Modal.Button onClick={onCancel} variant="tertiary">
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            {hasDeeplinkFailed && status.deeplinkFailed ? (
                <Banner variant="warning" icon>
                    <Translation id={status.deeplinkFailed} />
                </Banner>
            ) : (
                <Paragraph>
                    <Translation id={status.description}></Translation>
                </Paragraph>
            )}
        </Modal>
    );
};
