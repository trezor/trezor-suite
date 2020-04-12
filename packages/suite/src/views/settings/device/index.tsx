/* eslint-disable @typescript-eslint/camelcase */
import { SettingsLayout } from '@settings-components';
import { Translation } from '@suite-components';
import {
    ActionButton,
    ActionColumn,
    ActionInput,
    Row,
    SectionItem,
    Section,
    TextColumn,
} from '@suite-components/Settings';
import {
    DRY_RUN_URL,
    FAILED_BACKUP_URL,
    PASSPHRASE_URL,
    SEED_MANUAL_URL,
} from '@suite-constants/urls';
import { getFwVersion, isBitcoinOnly } from '@suite-utils/device';
import * as homescreen from '@suite-utils/homescreen';
import { useDeviceActionLocks } from '@suite-utils/hooks';
import { colors, H2, Link, P, Switch } from '@trezor/components';
import React, { createRef, useEffect, useState } from 'react';
import styled from 'styled-components';

import { Props } from './Container';

const RotationButton = styled(ActionButton)`
    min-width: 78px;
`;

const BackupFailedRow = styled(Row)`
    background-color: ${colors.BLACK96};
`;

const BackupFailedLink = styled(Link)`
    min-width: 120px;
    margin-left: 40px;
`;

const HiddenInput = styled.input`
    display: none;
`;

const Col = styled.div`
    flex-direction: column;
`;

const Settings = ({ device, applySettings, changePin, openModal, goto }: Props) => {
    const [label, setLabel] = useState('');
    const [customHomescreen, setCustomHomescreen] = useState('');
    const fileInputElement = createRef<HTMLInputElement>();
    const [actionEnabled] = useDeviceActionLocks();

    useEffect(() => {
        if (!device) {
            return;
        }
        setLabel(device.label);
    }, [device]);

    if (!device?.features) {
        return (
            <SettingsLayout>
                <Translation
                    id="TR_DEVICE_LABEL_IS_DISCONNECTED"
                    values={{ deviceLabel: device?.label || '' }}
                />
            </SettingsLayout>
        );
    }

    const DISPLAY_ROTATIONS = [
        { label: <Translation id="TR_NORTH" />, value: 0 },
        { label: <Translation id="TR_EAST" />, value: 90 },
        { label: <Translation id="TR_SOUTH" />, value: 180 },
        { label: <Translation id="TR_WEST" />, value: 270 },
    ] as const;

    const { features } = device;

    const onUploadHomescreen = async (files: FileList | null) => {
        if (!files || !files.length) return;
        const dataUrl = await homescreen.fileToDataUrl(files[0]);
        setCustomHomescreen(dataUrl);
    };

    const onSelectCustomHomescreen = async () => {
        const element = document.getElementById('custom-image');
        if (element instanceof HTMLImageElement) {
            const hex = homescreen.elementToHomescreen(element, device.features.major_version);
            await applySettings({ homescreen: hex });
            setCustomHomescreen('');
        }
    };

    return (
        <SettingsLayout>
            <H2>{device.label}</H2>
            <Section title={<Translation id="TR_BACKUP" />}>
                <SectionItem>
                    <TextColumn
                        title={<Translation id="TR_BACKUP_RECOVERY_SEED" />}
                        description={<Translation id="TR_RECOVERY_SEED_IS" />}
                        learnMore={SEED_MANUAL_URL}
                    />
                    <ActionColumn>
                        <ActionButton
                            data-test="@settings/device/create-backup-button"
                            onClick={() => goto('backup-index', { cancelable: true })}
                            isDisabled={
                                !actionEnabled ||
                                !features.needs_backup ||
                                features.unfinished_backup
                            }
                        >
                            {features.needs_backup && <Translation id="TR_CREATE_BACKUP" />}
                            {!features.needs_backup &&
                                !features.unfinished_backup &&
                                'Backup successful'}
                            {features.unfinished_backup && 'Backup failed'}
                        </ActionButton>
                    </ActionColumn>
                </SectionItem>
                {features.unfinished_backup && (
                    <BackupFailedRow data-test="@settings/device/failed-backup-row">
                        <P size="tiny">
                            <Translation id="TR_BACKUP_FAILED" />
                        </P>
                        <ActionColumn>
                            <BackupFailedLink href={FAILED_BACKUP_URL}>
                                <Translation id="TR_WHAT_TO_DO_NOW" />
                            </BackupFailedLink>
                        </ActionColumn>
                    </BackupFailedRow>
                )}
                {!features.unfinished_backup && (
                    <SectionItem>
                        <TextColumn
                            title={<Translation id="TR_CHECK_RECOVERY_SEED" />}
                            description={<Translation id="TR_RECOVERY_SEED_IS" />}
                            learnMore={DRY_RUN_URL}
                        />
                        <ActionColumn>
                            <ActionButton
                                data-test="@settings/device/check-seed-button"
                                onClick={() => goto('recovery-index', { cancelable: true })}
                                isDisabled={
                                    !actionEnabled ||
                                    features.needs_backup ||
                                    features.unfinished_backup
                                }
                                variant="secondary"
                            >
                                <Translation id="TR_CHECK_SEED" />
                            </ActionButton>
                        </ActionColumn>
                    </SectionItem>
                )}
            </Section>
            <Section title="Security">
                <SectionItem>
                    <TextColumn
                        title={<Translation id="TR_FIRMWARE_VERSION" />}
                        description={
                            <>
                                <Translation
                                    id="TR_YOUR_CURRENT_FIRMWARE"
                                    values={{ version: getFwVersion(device) }}
                                />
                                {isBitcoinOnly(device) && ' (bitcoin-only)'}
                            </>
                        }
                    />
                    <ActionColumn>
                        <ActionButton
                            variant="secondary"
                            onClick={() => goto('firmware-index', { cancelable: true })}
                            data-test="@settings/device/update-button"
                            isDisabled={!actionEnabled}
                        >
                            {device &&
                                ['required', 'outdated'].includes(device.firmware) &&
                                'Update available'}
                            {device && device.firmware === 'valid' && 'Up to date'}
                        </ActionButton>
                    </ActionColumn>
                </SectionItem>
                <SectionItem>
                    <TextColumn
                        title={<Translation id="TR_DEVICE_SETTINGS_PIN_PROTECTION_TITLE" />}
                        description={<Translation id="TR_DEVICE_SETTINGS_PIN_PROTECTION_DESC" />}
                    />
                    <ActionColumn>
                        <Switch
                            checked={!!features.pin_protection}
                            onChange={() => changePin({ remove: features.pin_protection })}
                            isDisabled={!actionEnabled}
                        />
                    </ActionColumn>
                </SectionItem>
                {features.pin_protection && (
                    <SectionItem>
                        <TextColumn
                            title="Change PIN"
                            description="In case your PIN has been exposed or you simply want to change it, here you go. There is no limit of how many times you can change your PIN."
                        />
                        <ActionColumn>
                            <ActionButton
                                onClick={() => changePin({ remove: false })}
                                isDisabled={!actionEnabled}
                                variant="secondary"
                                data-test="@settings/device/update-button"
                            >
                                Change PIN
                            </ActionButton>
                        </ActionColumn>
                    </SectionItem>
                )}

                <SectionItem>
                    <TextColumn
                        title={<Translation id="TR_DEVICE_SETTINGS_PASSPHRASE_TITLE" />}
                        description={
                            <>
                                <Translation id="TR_DEVICE_SETTINGS_PASSPHRASE_DESC" />
                                <Translation id="TR_DEVICE_SETTINGS_PASSPHRASE_DESC_MORE" />
                            </>
                        }
                        learnMore={PASSPHRASE_URL}
                    />
                    <ActionColumn>
                        <Switch
                            checked={!!features.passphrase_protection}
                            onChange={() =>
                                applySettings({
                                    use_passphrase: !features.passphrase_protection,
                                })
                            }
                            data-test="@settings/device/passphrase-switch"
                            isDisabled={!actionEnabled}
                        />
                    </ActionColumn>
                </SectionItem>
            </Section>
            <Section title={<Translation id="TR_PERSONALIZATION" />}>
                <SectionItem>
                    <TextColumn title={<Translation id="TR_DEVICE_SETTINGS_DEVICE_LABEL" />} />
                    <ActionColumn>
                        <ActionInput
                            variant="small"
                            value={label}
                            onChange={(event: React.FormEvent<HTMLInputElement>) =>
                                setLabel(event.currentTarget.value)
                            }
                            data-test="@settings/device/label-input"
                            readOnly={!actionEnabled}
                        />
                        <ActionButton
                            onClick={() => applySettings({ label })}
                            isDisabled={!actionEnabled}
                            data-test="@settings/device/label-submit"
                        >
                            <Translation id="TR_DEVICE_SETTINGS_DEVICE_EDIT_LABEL" />
                        </ActionButton>
                    </ActionColumn>
                </SectionItem>
                <SectionItem>
                    <TextColumn
                        title={<Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_TITLE" />}
                        description={
                            // display text only for T2, it relates to what kind of image may be uploaded
                            // but custom upload is enabled only for T2 now.
                            features.major_version === 2 ? (
                                <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS" />
                            ) : (
                                ''
                            )
                        }
                    />
                    <ActionColumn>
                        <HiddenInput
                            ref={fileInputElement}
                            type="file"
                            accept=".png"
                            onChange={e => {
                                onUploadHomescreen(e.target.files);
                            }}
                        />
                        {/* only available for model T at the moment. It works quite well there */}
                        {features.major_version === 2 && (
                            <ActionButton
                                onClick={() => {
                                    if (fileInputElement.current) {
                                        fileInputElement.current.click();
                                    }
                                }}
                                isDisabled={!actionEnabled}
                                variant="secondary"
                            >
                                <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_UPLOAD_IMAGE" />
                            </ActionButton>
                        )}

                        <ActionButton
                            onClick={() =>
                                openModal({
                                    type: 'device-background-gallery',
                                    device,
                                })
                            }
                            isDisabled={!actionEnabled}
                            data-test="@settings/device/select-from-gallery"
                            variant="secondary"
                        >
                            <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_SELECT_FROM_GALLERY" />
                        </ActionButton>
                    </ActionColumn>
                </SectionItem>
                {customHomescreen && (
                    <SectionItem>
                        <Col>
                            <img
                                width="144px"
                                alt="custom homescreen"
                                id="custom-image"
                                src={customHomescreen}
                            />
                        </Col>

                        <ActionColumn>
                            <ActionButton onClick={() => onSelectCustomHomescreen()}>
                                Change homescreen
                            </ActionButton>
                            <ActionButton
                                variant="secondary"
                                onClick={() => setCustomHomescreen('')}
                                isDisabled={!actionEnabled}
                            >
                                Drop image
                            </ActionButton>
                        </ActionColumn>
                    </SectionItem>
                )}
                {features.major_version === 2 && (
                    <SectionItem>
                        <TextColumn
                            title={<Translation id="TR_DEVICE_SETTINGS_DISPLAY_ROTATION" />}
                        />
                        <ActionColumn>
                            {DISPLAY_ROTATIONS.map(variant => (
                                <RotationButton
                                    key={variant.value}
                                    variant="secondary"
                                    onClick={() =>
                                        applySettings({
                                            display_rotation: variant.value,
                                        })
                                    }
                                    data-test={`@settings/device/rotation-button/${variant.value}`}
                                    isDisabled={!actionEnabled}
                                >
                                    {variant.label}
                                </RotationButton>
                            ))}
                        </ActionColumn>
                    </SectionItem>
                )}
            </Section>
            <Section title={<Translation id="TR_ADVANCED" />}>
                <SectionItem>
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
                            isDisabled={!actionEnabled}
                            data-test="@settings/device/open-wipe-modal-button"
                        >
                            <Translation id="TR_DEVICE_SETTINGS_BUTTON_WIPE_DEVICE" />
                        </ActionButton>
                    </ActionColumn>
                </SectionItem>
            </Section>
        </SettingsLayout>
    );
};

export default Settings;
