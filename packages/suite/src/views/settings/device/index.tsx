import React, { createRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import { SettingsLayout } from '@settings-components';
import { Translation } from '@suite-components';
import {
    ActionButton,
    ActionColumn,
    ActionInput,
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
import { useDevice, useAnalytics, useActions, useSelector } from '@suite-hooks';
import { variables, Switch } from '@trezor/components';
import * as routerActions from '@suite-actions/routerActions';
import * as modalActions from '@suite-actions/modalActions';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';

const RotationButton = styled(ActionButton)`
    min-width: 81px;
    margin: 4px;
    flex-basis: 45%;

    @media screen and (min-width: ${variables.SCREEN_SIZE.MD}) {
        flex-basis: auto;
    }
`;

const HiddenInput = styled.input`
    display: none;
`;

const Col = styled.div`
    flex-direction: column;
`;

const Settings = () => {
    const device = useSelector(state => state.suite.device);
    const { applySettings, changePin, goto, openModal } = useActions({
        applySettings: deviceSettingsActions.applySettings,
        changePin: deviceSettingsActions.changePin,
        goto: routerActions.goto,
        openModal: modalActions.openModal,
    });

    const [label, setLabel] = useState('');
    const [customHomescreen, setCustomHomescreen] = useState('');
    const fileInputElement = createRef<HTMLInputElement>();
    const { isLocked } = useDevice();
    const isDeviceLocked = isLocked();
    const analytics = useAnalytics();
    const MAX_LABEL_LENGTH = 16;

    useEffect(() => {
        if (!device) {
            return;
        }
        setLabel(device.label);
    }, [device]);

    if (!device?.features) {
        return null;
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
            <Section title={<Translation id="TR_BACKUP" />}>
                {!features.unfinished_backup && (
                    <SectionItem>
                        <TextColumn
                            title={<Translation id="TR_BACKUP_RECOVERY_SEED" />}
                            description={<Translation id="TR_BACKUP_SUBHEADING_1" />}
                            learnMore={SEED_MANUAL_URL}
                        />
                        <ActionColumn>
                            <ActionButton
                                data-test="@settings/device/create-backup-button"
                                onClick={() => {
                                    goto('backup-index', { cancelable: true });
                                    analytics.report({
                                        type: 'settings/device/goto/backup',
                                    });
                                }}
                                isDisabled={
                                    isDeviceLocked ||
                                    !features.needs_backup ||
                                    features.unfinished_backup
                                }
                            >
                                {features.needs_backup && <Translation id="TR_CREATE_BACKUP" />}
                                {!features.needs_backup && !features.unfinished_backup && (
                                    <Translation id="TR_BACKUP_SUCCESSFUL" />
                                )}
                            </ActionButton>
                        </ActionColumn>
                    </SectionItem>
                )}
                {features.unfinished_backup && (
                    <SectionItem data-test="@settings/device/failed-backup-row">
                        <TextColumn
                            title={<Translation id="TR_BACKUP_RECOVERY_SEED_FAILED_TITLE" />}
                            description={<Translation id="TR_BACKUP_RECOVERY_SEED_FAILED_DESC" />}
                            learnMore={FAILED_BACKUP_URL}
                        />
                        <ActionColumn>
                            <ActionButton isDisabled>
                                {features.unfinished_backup && (
                                    <Translation id="TR_BACKUP_FAILED" />
                                )}
                            </ActionButton>
                        </ActionColumn>
                    </SectionItem>
                )}
                {!features.unfinished_backup && (
                    <SectionItem>
                        <TextColumn
                            title={<Translation id="TR_CHECK_RECOVERY_SEED" />}
                            description={<Translation id="TR_CHECK_RECOVERY_SEED_DESCRIPTION" />}
                            learnMore={DRY_RUN_URL}
                        />
                        <ActionColumn>
                            <ActionButton
                                data-test="@settings/device/check-seed-button"
                                onClick={() => {
                                    goto('recovery-index', { cancelable: true });
                                    analytics.report({
                                        type: 'settings/device/goto/recovery',
                                    });
                                }}
                                isDisabled={
                                    isDeviceLocked ||
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
            <Section title={<Translation id="TR_DEVICE_SECURITY" />}>
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
                            onClick={() => {
                                goto('firmware-index', { cancelable: true });
                                analytics.report({
                                    type: 'settings/device/goto/firmware',
                                });
                            }}
                            data-test="@settings/device/update-button"
                            isDisabled={isDeviceLocked}
                        >
                            {device && ['required', 'outdated'].includes(device.firmware) && (
                                <Translation id="TR_UPDATE_AVAILABLE" />
                            )}
                            {device && device.firmware === 'valid' && (
                                <Translation id="TR_UP_TO_DATE" />
                            )}
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
                            onChange={() => {
                                changePin({ remove: features.pin_protection });
                                analytics.report({
                                    type: 'settings/device/change-pin-protection',
                                    payload: {
                                        remove: features.pin_protection,
                                    },
                                });
                            }}
                            isDisabled={isDeviceLocked}
                            data-test="@settings/device/pin-switch"
                        />
                    </ActionColumn>
                </SectionItem>
                {features.pin_protection && (
                    <SectionItem>
                        <TextColumn
                            title={<Translation id="TR_DEVICE_SETTINGS_CHANGE_PIN_TITLE" />}
                            description={<Translation id="TR_DEVICE_SETTINGS_CHANGE_PIN_DESC" />}
                        />
                        <ActionColumn>
                            <ActionButton
                                onClick={() => {
                                    changePin({ remove: false });
                                    analytics.report({
                                        type: 'settings/device/change-pin',
                                    });
                                }}
                                isDisabled={isDeviceLocked}
                                variant="secondary"
                            >
                                <Translation id="TR_CHANGE_PIN" />
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
                            onChange={() => {
                                applySettings({
                                    use_passphrase: !features.passphrase_protection,
                                });
                                analytics.report({
                                    type: 'settings/device/change-passphrase-protection',
                                    payload: {
                                        use_passphrase: !features.passphrase_protection,
                                    },
                                });
                            }}
                            data-test="@settings/device/passphrase-switch"
                            isDisabled={isDeviceLocked}
                        />
                    </ActionColumn>
                </SectionItem>
            </Section>
            <Section title={<Translation id="TR_PERSONALIZATION" />}>
                <SectionItem>
                    <TextColumn
                        title={<Translation id="TR_DEVICE_SETTINGS_DEVICE_LABEL" />}
                        description={
                            <Translation
                                id="TR_MAX_LABEL_LENGTH_IS"
                                values={{ length: MAX_LABEL_LENGTH }}
                            />
                        }
                    />
                    <ActionColumn>
                        <ActionInput
                            noTopLabel
                            noError
                            value={label}
                            state={label.length > MAX_LABEL_LENGTH ? 'error' : undefined}
                            onChange={(event: React.FormEvent<HTMLInputElement>) =>
                                setLabel(event.currentTarget.value)
                            }
                            data-test="@settings/device/label-input"
                            readOnly={isDeviceLocked}
                        />
                        <ActionButton
                            onClick={() => {
                                applySettings({ label });
                                analytics.report({
                                    type: 'settings/device/change-label',
                                });
                            }}
                            isDisabled={
                                isDeviceLocked ||
                                label.length > MAX_LABEL_LENGTH ||
                                label === device.label
                            }
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
                            accept=".png, .jpg"
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
                                isDisabled={isDeviceLocked}
                                variant="secondary"
                            >
                                <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_UPLOAD_IMAGE" />
                            </ActionButton>
                        )}

                        <ActionButton
                            onClick={() => {
                                openModal({
                                    type: 'device-background-gallery',
                                    device,
                                });
                                analytics.report({
                                    type: 'settings/device/goto/background',
                                });
                            }}
                            isDisabled={isDeviceLocked}
                            data-test="@settings/device/select-from-gallery"
                            variant="secondary"
                        >
                            <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_SELECT_FROM_GALLERY" />
                        </ActionButton>
                    </ActionColumn>
                </SectionItem>
                {customHomescreen && homescreen.isValid(customHomescreen) && (
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
                                <Translation id="TR_CHANGE_HOMESCREEN" />
                            </ActionButton>
                            <ActionButton
                                variant="secondary"
                                onClick={() => setCustomHomescreen('')}
                                isDisabled={isDeviceLocked}
                            >
                                <Translation id="TR_DROP_IMAGE" />
                            </ActionButton>
                        </ActionColumn>
                    </SectionItem>
                )}
                {customHomescreen && !homescreen.isValid(customHomescreen) && (
                    <SectionItem>
                        <Col>
                            <Translation id="TR_INVALID_FILE_SELECTED" />
                        </Col>
                        <ActionColumn>
                            <ActionButton
                                variant="secondary"
                                onClick={() => setCustomHomescreen('')}
                                isDisabled={isDeviceLocked}
                            >
                                <Translation id="TR_DROP_IMAGE" />
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
                                    onClick={() => {
                                        applySettings({
                                            display_rotation: variant.value,
                                        });
                                        analytics.report({
                                            type: 'settings/device/change-orientation',
                                            payload: {
                                                value: variant.value,
                                            },
                                        });
                                    }}
                                    data-test={`@settings/device/rotation-button/${variant.value}`}
                                    isDisabled={isDeviceLocked}
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
                            onClick={() => {
                                openModal({
                                    type: 'wipe-device',
                                });
                                analytics.report({
                                    type: 'settings/device/goto/wipe',
                                });
                            }}
                            variant="danger"
                            isDisabled={isDeviceLocked}
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
