/* eslint-disable @typescript-eslint/camelcase */

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { H2, P, Switch, Link, colors } from '@trezor/components-v2';

import { SUITE } from '@suite-actions/constants';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { SuiteLayout } from '@suite-components';
import { Menu as SettingsMenu } from '@settings-components';
// import { getFwVersion } from '@suite-utils/device';
import { SEED_MANUAL_URL, DRY_RUN_URL, PASSPHRASE_URL } from '@suite-constants/urls';
import { AcquiredDevice } from '@suite-types';

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

const Settings = ({
    device,
    locks,
    applySettings,
    changePin,
    wipeDevice,
    backupDevice,
    openModal,
    checkSeed,
    goto,
}: Props) => {
    const uiLocked = locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI);
    const [label, setLabel] = useState('');

    useEffect(() => {
        if (!device) {
            return;
        }
        setLabel(device.label);
    }, [device]);

    // any idea how to write this in a sane way
    let features: any;
    if (device && device.features) {
        /* eslint-disable no-unused-expressions */
        (features = device.features) as AcquiredDevice['features'];
    }

    const startCheckSeed = () => {
        if (features.major_version === 1) {
            // T1 needs to input some more information from suite. TT does everything on device.
            goto('seed-input-index', { cancelable: true });
        } else {
            checkSeed();
        }
    };

    const DISPLAY_ROTATIONS = [
        { label: <Translation {...messages.TR_NORTH} />, value: 0 },
        { label: <Translation {...messages.TR_EAST} />, value: 90 },
        { label: <Translation {...messages.TR_SOUTH} />, value: 180 },
        { label: <Translation {...messages.TR_WEST} />, value: 270 },
    ] as const;

    return (
        <SuiteLayout title="Settings" secondaryMenu={<SettingsMenu />}>
            {/* todo: imho base padding should be in SuiteLayout, but it would break WalletLayout, so I have it temporarily here */}
            <div style={{ padding: '30px' }}>
                <H2>
                    <Translation>{messages.TR_DEVICE_SETTINGS_TITLE}</Translation>
                </H2>

                {(!device || !device.features) && <>no device connected</>}
                {device && device.features && (
                    <>
                        <Section header={<Translation>{messages.TR_BACKUP}</Translation>}>
                            <Row>
                                <TextColumn
                                    title={
                                        <Translation>
                                            {messages.TR_BACKUP_RECOVERY_SEED}
                                        </Translation>
                                    }
                                    description={
                                        <Translation>{messages.TR_RECOVERY_SEED_IS}</Translation>
                                    }
                                    learnMore={SEED_MANUAL_URL}
                                />
                                <ActionColumn>
                                    <ActionButton
                                        onClick={() => backupDevice({ device })}
                                        isDisabled={
                                            uiLocked ||
                                            !features.needs_backup ||
                                            features.unfinished_backup
                                        }
                                    >
                                        {features.needs_backup && (
                                            <Translation>{messages.TR_CREATE_BACKUP}</Translation>
                                        )}
                                        {!features.needs_backup &&
                                            !features.unfinished_backup &&
                                            'Backup successful'}
                                        {features.unfinished_backup && 'Backup failed'}
                                    </ActionButton>
                                </ActionColumn>
                            </Row>

                            {features.unfinished_backup && (
                                <BackupFailedRow>
                                    <P size="tiny">
                                        <Translation>{messages.TR_BACKUP_FAILED}</Translation>
                                    </P>
                                    <ActionColumn>
                                        {/* todo: add proper link */}
                                        <BackupFailedLink href="https://fooo">
                                            <Translation>{messages.TR_WHAT_TO_DO_NOW}</Translation>
                                        </BackupFailedLink>
                                    </ActionColumn>
                                </BackupFailedRow>
                            )}

                            {!features.unfinished_backup && (
                                <Row>
                                    <TextColumn
                                        title={
                                            <Translation>
                                                {messages.TR_CHECK_RECOVERY_SEED}
                                            </Translation>
                                        }
                                        description={
                                            <Translation>
                                                {messages.TR_RECOVERY_SEED_IS}
                                            </Translation>
                                        }
                                        learnMore={DRY_RUN_URL}
                                    />
                                    <ActionColumn>
                                        <ActionButton
                                            onClick={() => {
                                                startCheckSeed();
                                            }}
                                            isDisabled={
                                                uiLocked ||
                                                features.needs_backup ||
                                                features.unfinished_backup
                                            }
                                            variant="secondary"
                                        >
                                            <Translation>{messages.TR_CHECK_SEED}</Translation>
                                        </ActionButton>
                                    </ActionColumn>
                                </Row>
                            )}
                        </Section>

                        <Section header="Security">
                            <Row>
                                <TextColumn
                                    title={
                                        <Translation>{messages.TR_FIRMWARE_VERSION}</Translation>
                                    }
                                    description={
                                        <Translation
                                            values={{ version: '1.2.3' }}
                                            // values={{ version: getFwVersion(device) }}
                                            {...messages.TR_YOUR_CURRENT_FIRMWARE}
                                        />
                                    }
                                    learnMore={SEED_MANUAL_URL}
                                />
                                <ActionColumn>
                                    <ActionButton
                                        variant="secondary"
                                        onClick={() => goto('firmware-index', { cancelable: true })}
                                        data-test="@suite/settings/device/update-button"
                                        isDisabled={
                                            uiLocked
                                            // TODO: for development and testing purposes is disable disabled
                                            // || (device && !['required', 'outdated'].includes(device.firmware))
                                        }
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
                                    title={
                                        <Translation>
                                            {messages.TR_DEVICE_SETTINGS_PIN_PROTECTION_TITLE}
                                        </Translation>
                                    }
                                    description={
                                        <Translation
                                            {...messages.TR_DEVICE_SETTINGS_PIN_PROTECTION_DESC}
                                        />
                                    }
                                />

                                <ActionColumn>
                                    <Switch
                                        checked={!!features.pin_protection}
                                        onChange={() =>
                                            changePin({ remove: features.pin_protection })
                                        }
                                        // isDisabled={uiLocked}
                                    />
                                </ActionColumn>
                            </Row>

                            <Row>
                                <TextColumn
                                    title={
                                        <Translation>
                                            {messages.TR_DEVICE_SETTINGS_PASSPHRASE_TITLE}
                                        </Translation>
                                    }
                                    description={
                                        <>
                                            <Translation>
                                                {messages.TR_DEVICE_SETTINGS_PASSPHRASE_DESC}
                                            </Translation>
                                            <Translation>
                                                {messages.TR_DEVICE_SETTINGS_PASSPHRASE_DESC_MORE}
                                            </Translation>
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
                                        data-test="@suite/settings/device/passphrase-switch"
                                        // isDisabled={uiLocked}
                                    />
                                </ActionColumn>
                            </Row>
                        </Section>

                        <Section header="Personalization">
                            <Row>
                                <TextColumn
                                    title={
                                        <Translation>
                                            {messages.TR_DEVICE_SETTINGS_DEVICE_LABEL}
                                        </Translation>
                                    }
                                />
                                <ActionColumn>
                                    <ActionInput
                                        value={label}
                                        onChange={(event: React.FormEvent<HTMLInputElement>) =>
                                            setLabel(event.currentTarget.value)
                                        }
                                        data-test="@suite/settings/device/label-input"
                                    />
                                    <ActionButton
                                        onClick={() => applySettings({ label })}
                                        isDisabled={uiLocked}
                                        data-test="@suite/settings/device/label-submit"
                                    >
                                        <Translation>
                                            {messages.TR_DEVICE_SETTINGS_DEVICE_EDIT_LABEL}
                                        </Translation>
                                    </ActionButton>
                                </ActionColumn>
                            </Row>

                            <Row>
                                <TextColumn
                                    title={
                                        <Translation>
                                            {messages.TR_DEVICE_SETTINGS_HOMESCREEN_TITLE}
                                        </Translation>
                                    }
                                    description={
                                        <Translation>
                                            {messages.TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS}
                                        </Translation>
                                    }
                                />
                                <ActionColumn>
                                    <ActionButton
                                        onClick={() => console.log('woo')}
                                        isDisabled={uiLocked}
                                        variant="secondary"
                                    >
                                        <Translation>
                                            {messages.TR_DEVICE_SETTINGS_HOMESCREEN_UPLOAD_IMAGE}
                                        </Translation>
                                    </ActionButton>
                                    <ActionButton
                                        onClick={() =>
                                            openModal({
                                                type: 'device-background-gallery',
                                                device,
                                            })
                                        }
                                        isDisabled={uiLocked}
                                        data-test="@suite/settings/device/select-from-gallery"
                                        variant="secondary"
                                    >
                                        <Translation>
                                            {
                                                messages.TR_DEVICE_SETTINGS_HOMESCREEN_SELECT_FROM_GALLERY
                                            }
                                        </Translation>
                                    </ActionButton>
                                </ActionColumn>
                            </Row>

                            {features.major_version === 2 && (
                                <Row>
                                    <TextColumn
                                        title={
                                            <Translation>
                                                {messages.TR_DEVICE_SETTINGS_DISPLAY_ROTATION}
                                            </Translation>
                                        }
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
                                                data-test={`@suite/settings/device/rotation-button/${variant.value}`}
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
                                    title={
                                        <Translation>
                                            {messages.TR_DEVICE_SETTINGS_BUTTON_WIPE_DEVICE}
                                        </Translation>
                                    }
                                    description={
                                        <Translation>{messages.TR_WIPING_YOUR_DEVICE}</Translation>
                                    }
                                />
                                <ActionColumn>
                                    <ActionButton
                                        variant="danger"
                                        onClick={() => wipeDevice()}
                                        isDisabled={uiLocked}
                                        data-test="@suite/settings/device/wipe-button"
                                    >
                                        <Translation>
                                            {messages.TR_DEVICE_SETTINGS_BUTTON_WIPE_DEVICE}
                                        </Translation>
                                    </ActionButton>
                                </ActionColumn>
                            </Row>
                        </Section>
                    </>
                )}
            </div>
        </SuiteLayout>
    );
};

export default Settings;
