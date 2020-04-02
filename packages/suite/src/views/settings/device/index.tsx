/* eslint-disable @typescript-eslint/camelcase */

import React, { useEffect, useState, createRef } from 'react';
import styled from 'styled-components';
import { P, Switch, Link, colors } from '@trezor/components';

import { SUITE } from '@suite-actions/constants';

import { Translation, Card } from '@suite-components';
import { SettingsLayout } from '@settings-components';
import { getFwVersion, isBitcoinOnly } from '@suite-utils/device';
import {
    SEED_MANUAL_URL,
    DRY_RUN_URL,
    PASSPHRASE_URL,
    FAILED_BACKUP_URL,
} from '@suite-constants/urls';
import * as homescreen from '@suite-utils/homescreen';

import { Props } from './Container';

import {
    Section,
    ActionColumn,
    Row,
    TextColumn,
    ActionButton,
    ActionInput,
} from '@suite-components/Settings';

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

const StyledCard = styled(Card)`
    margin-top: 16px;
    display: flex;
    padding: 20px;
    flex-direction: column;
`;

const Col = styled.div`
    flex-direction: column;
`;

const Settings = ({ device, locks, applySettings, changePin, openModal, goto }: Props) => {
    const uiLocked = locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI);
    const [label, setLabel] = useState('');
    const [customHomescreen, setCustomHomescreen] = useState('');
    const fileInputElement = createRef<HTMLInputElement>();

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
            <StyledCard>
                <Section header={<Translation id="TR_BACKUP" />}>
                    <Row>
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
                                    uiLocked || !features.needs_backup || features.unfinished_backup
                                }
                            >
                                {features.needs_backup && <Translation id="TR_CREATE_BACKUP" />}
                                {!features.needs_backup &&
                                    !features.unfinished_backup &&
                                    'Backup successful'}
                                {features.unfinished_backup && 'Backup failed'}
                            </ActionButton>
                        </ActionColumn>
                    </Row>

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
                        <Row>
                            <TextColumn
                                title={<Translation id="TR_CHECK_RECOVERY_SEED" />}
                                description={<Translation id="TR_RECOVERY_SEED_IS" />}
                                learnMore={DRY_RUN_URL}
                            />
                            <ActionColumn>
                                <ActionButton
                                    data-test="@settings/device/check-seed-button"
                                    onClick={() => {
                                        goto('recovery-index', { cancelable: true });
                                    }}
                                    isDisabled={
                                        uiLocked ||
                                        features.needs_backup ||
                                        features.unfinished_backup
                                    }
                                    variant="secondary"
                                >
                                    <Translation id="TR_CHECK_SEED" />
                                </ActionButton>
                            </ActionColumn>
                        </Row>
                    )}
                </Section>

                <Section header="Security">
                    <Row>
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
                                isDisabled={uiLocked}
                            >
                                {device &&
                                    ['required', 'outdated'].includes(device.firmware) &&
                                    'Update available'}
                                {device && device.firmware === 'valid' && 'Up to date'}
                            </ActionButton>
                        </ActionColumn>
                    </Row>

                    <Row>
                        <TextColumn
                            title={<Translation id="TR_DEVICE_SETTINGS_PIN_PROTECTION_TITLE" />}
                            description={
                                <Translation id="TR_DEVICE_SETTINGS_PIN_PROTECTION_DESC" />
                            }
                        />

                        <ActionColumn>
                            <Switch
                                checked={!!features.pin_protection}
                                onChange={() => changePin({ remove: features.pin_protection })}
                                // isDisabled={uiLocked}
                            />
                        </ActionColumn>
                    </Row>

                    {features.pin_protection && (
                        <Row>
                            <TextColumn
                                title="Change PIN"
                                description="In case your PIN has been exposed or you simply want to change it, here you go. There is no limit of how many times you can change your PIN."
                            />
                            <ActionColumn>
                                <ActionButton
                                    onClick={() => changePin({ remove: false })}
                                    // isDisabled={uiLocked}
                                    variant="secondary"
                                    data-test="@settings/device/update-button"
                                >
                                    Change PIN
                                </ActionButton>
                            </ActionColumn>
                        </Row>
                    )}

                    <Row>
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
                                // isDisabled={uiLocked}
                            />
                        </ActionColumn>
                    </Row>
                </Section>

                <Section header="Personalization">
                    <Row>
                        <TextColumn title={<Translation id="TR_DEVICE_SETTINGS_DEVICE_LABEL" />} />
                        <ActionColumn>
                            <ActionInput
                                variant="small"
                                value={label}
                                onChange={(event: React.FormEvent<HTMLInputElement>) =>
                                    setLabel(event.currentTarget.value)
                                }
                                data-test="@settings/device/label-input"
                            />
                            <ActionButton
                                onClick={() => applySettings({ label })}
                                isDisabled={uiLocked}
                                data-test="@settings/device/label-submit"
                            >
                                <Translation id="TR_DEVICE_SETTINGS_DEVICE_EDIT_LABEL" />
                            </ActionButton>
                        </ActionColumn>
                    </Row>

                    <Row>
                        <TextColumn
                            title={<Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_TITLE" />}
                            description={
                                <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS" />
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
                                    isDisabled={uiLocked}
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
                                isDisabled={uiLocked}
                                data-test="@settings/device/select-from-gallery"
                                variant="secondary"
                            >
                                <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_SELECT_FROM_GALLERY" />
                            </ActionButton>
                        </ActionColumn>
                    </Row>

                    {customHomescreen && (
                        <Row>
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
                                >
                                    Drop image
                                </ActionButton>
                            </ActionColumn>
                        </Row>
                    )}

                    {features.major_version === 2 && (
                        <Row>
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
                                        isDisabled={uiLocked}
                                    >
                                        {variant.label}
                                    </RotationButton>
                                ))}
                            </ActionColumn>
                        </Row>
                    )}
                </Section>

                <Section borderless>
                    <Row>
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
                                isDisabled={uiLocked}
                                data-test="@settings/device/open-wipe-modal-button"
                            >
                                <Translation id="TR_DEVICE_SETTINGS_BUTTON_WIPE_DEVICE" />
                            </ActionButton>
                        </ActionColumn>
                    </Row>
                </Section>
            </StyledCard>
        </SettingsLayout>
    );
};

export default Settings;
