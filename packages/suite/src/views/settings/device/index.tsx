/* eslint-disable @typescript-eslint/camelcase */
import React, { useEffect, useState } from 'react';
import { SUITE } from '@suite-actions/constants';
import { H2, Switch } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { SuiteLayout, SettingsMenu } from '@suite-components';
import { getFwVersion } from '@suite-utils/device';

import { Props } from './Container';
import { SEED_MANUAL_URL } from '@onboarding-constants/urls';
import { DRY_RUN_URL, PASSPHRASE_URL } from '@suite-constants/urls';

import {
    Section,
    ActionColumn,
    Row,
    TextColumn,
    ActionSelect,
    ActionButton,
    ActionInput,
} from '@suite-components/Settings';

const Settings = ({
    device,
    locks,
    applySettings,
    changePin,
    wipeDevice,
    openBackgroundGalleryModal,
}: Props) => {
    const uiLocked = locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI);
    const [label, setLabel] = useState('');

    useEffect(() => {
        if (!device) {
            return;
        }
        setLabel(device.label);
    }, [device]);

    if (!device || !device.features) {
        return null;
    }

    const { features } = device;

    const DISPLAY_ROTATIONS = [
        { label: 'North (default)', value: 0 },
        { label: 'East', value: 90 },
        { label: 'South', value: 180 },
        { label: 'West', value: 270 },
    ] as const;

    return (
        <SuiteLayout title="Settings" secondaryMenu={<SettingsMenu />}>
            {/* todo: imho base padding should be in SuiteLayout, but it would break WalletLayout, so I have it temporarily here */}
            <div style={{ padding: '30px' }}>
                <H2>
                    <Translation>{messages.TR_DEVICE_SETTINGS_TITLE}</Translation>
                </H2>

                <Section header={<Translation>{messages.TR_BACKUP}</Translation>}>
                    <Row>
                        <TextColumn
                            title={<Translation>{messages.TR_BACKUP_RECOVERY_SEED}</Translation>}
                            description={<Translation>{messages.TR_RECOVERY_SEED_IS}</Translation>}
                            learnMore={SEED_MANUAL_URL}
                        />
                        <ActionColumn>
                            <ActionButton onClick={() => console.log('foo')} isDisabled={uiLocked}>
                                <Translation>{messages.TR_CREATE_BACKUP}</Translation>
                            </ActionButton>
                        </ActionColumn>
                    </Row>

                    <Row>
                        <TextColumn
                            title={<Translation>{messages.TR_CHECK_RECOVERY_SEED}</Translation>}
                            description={<Translation>{messages.TR_RECOVERY_SEED_IS}</Translation>}
                            learnMore={DRY_RUN_URL}
                        />
                        <ActionColumn>
                            <ActionButton onClick={() => console.log('foo')} isDisabled={uiLocked}>
                                <Translation>{messages.TR_CHECK_SEED}</Translation>
                            </ActionButton>
                        </ActionColumn>
                    </Row>
                </Section>

                <Section header="Security">
                    <Row>
                        <TextColumn
                            title={<Translation>{messages.TR_FIRMWARE_VERSION}</Translation>}
                            description={
                                <Translation
                                    values={{ version: getFwVersion(device) }}
                                    {...messages.TR_YOUR_CURRENT_FIRMWARE}
                                />
                            }
                            learnMore={SEED_MANUAL_URL}
                        />
                        <ActionColumn>
                            <ActionButton onClick={() => console.log('boo')} isDisabled={uiLocked}>
                                Check for update
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
                                <Translation {...messages.TR_DEVICE_SETTINGS_PIN_PROTECTION_DESC} />
                            }
                        />

                        <ActionColumn>
                            <Switch
                                checked={features.pin_protection}
                                onChange={() => changePin({ remove: !features.pin_protection })}
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
                                checked={features.passphrase_protection}
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
                            <ActionButton onClick={() => console.log('woo')} isDisabled={uiLocked}>
                                <Translation>
                                    {messages.TR_DEVICE_SETTINGS_HOMESCREEN_UPLOAD_IMAGE}
                                </Translation>
                            </ActionButton>

                            <ActionButton
                                onClick={() => openBackgroundGalleryModal()}
                                isDisabled={uiLocked}
                                data-test="@suite/settings/device/select-from-gallery"
                            >
                                <Translation>
                                    {messages.TR_DEVICE_SETTINGS_HOMESCREEN_SELECT_FROM_GALLERY}
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
                                <ActionSelect
                                    options={DISPLAY_ROTATIONS.map(variant => ({
                                        label: variant.label,
                                        value: variant.value,
                                        'data-test': `@suite/settings/device/select-rotation/${variant.value}`,
                                    }))}
                                    // todo: this is not provided by device.features now
                                    value={null}
                                    onChange={(option: typeof DISPLAY_ROTATIONS[number]) =>
                                        applySettings({ display_rotation: option.value })
                                    }
                                    isDisabled={uiLocked}
                                    data-test="@suite/settings/device/select-rotation"
                                />
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
                            >
                                <Translation>
                                    {messages.TR_DEVICE_SETTINGS_BUTTON_WIPE_DEVICE}
                                </Translation>
                            </ActionButton>
                        </ActionColumn>
                    </Row>
                </Section>
            </div>
        </SuiteLayout>
    );
};

export default Settings;
