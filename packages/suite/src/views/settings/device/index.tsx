/* eslint-disable @typescript-eslint/camelcase */
import React, { useEffect, useState } from 'react';
import { SUITE } from '@suite-actions/constants';
import { H2 } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { SuiteLayout, SettingsMenu } from '@suite-components';
import { getFwVersion } from '@suite-utils/device';

import { Props } from './Container';
import { SEED_MANUAL_URL } from '@onboarding-constants/urls';
import { DRY_RUN_URL, PASSPHRASE_URL } from '@suite-constants/urls';
import { Section } from '@suite-components/Settings';

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

                <Section
                    controlsDisabled={uiLocked}
                    header={<Translation>{messages.TR_BACKUP}</Translation>}
                    rows={
                        [
                            {
                                left: [
                                    {
                                        type: 'description',
                                        value: (
                                            <Translation>
                                                {messages.TR_BACKUP_RECOVERY_SEED}
                                            </Translation>
                                        ),
                                    },
                                    {
                                        type: 'small-description',
                                        value: (
                                            <Translation>
                                                {messages.TR_RECOVERY_SEED_IS}
                                            </Translation>
                                        ),
                                    },
                                    {
                                        type: 'learn-more',
                                        href: SEED_MANUAL_URL,
                                    },
                                ],
                                right: [
                                    {
                                        type: 'button',
                                        value: (
                                            <Translation>{messages.TR_CREATE_BACKUP}</Translation>
                                        ),
                                        props: {
                                            onClick: () => console.log('fooo'),
                                        },
                                    },
                                ],
                            },
                            {
                                left: [
                                    {
                                        type: 'description',
                                        value: (
                                            <Translation>
                                                {messages.TR_CHECK_RECOVERY_SEED}
                                            </Translation>
                                        ),
                                    },
                                    {
                                        type: 'small-description',
                                        value: (
                                            <Translation>
                                                {messages.TR_RECOVERY_SEED_IS}
                                            </Translation>
                                        ),
                                    },
                                    {
                                        type: 'learn-more',
                                        href: DRY_RUN_URL,
                                    },
                                ],
                                right: [
                                    {
                                        type: 'button',
                                        value: <Translation>{messages.TR_CHECK_SEED}</Translation>,
                                        props: {
                                            onClick: () => console.log('fooo'),
                                        },
                                    },
                                ],
                            },
                        ] as const
                    }
                />

                <Section
                    controlsDisabled={uiLocked}
                    header="Security"
                    rows={
                        [
                            {
                                left: [
                                    {
                                        type: 'description',
                                        value: (
                                            <Translation>
                                                {messages.TR_FIRMWARE_VERSION}
                                            </Translation>
                                        ),
                                    },
                                    {
                                        type: 'small-description',
                                        value: (
                                            <Translation
                                                values={{ version: getFwVersion(device) }}
                                                {...messages.TR_YOUR_CURRENT_FIRMWARE}
                                            />
                                        ),
                                    },
                                    {
                                        type: 'learn-more',
                                        href: SEED_MANUAL_URL,
                                    },
                                ],
                                right: [
                                    {
                                        type: 'button',
                                        value: 'Check for update',
                                        props: {
                                            onClick: () => console.log('fooo'),
                                        },
                                    },
                                ],
                            },
                            //
                            {
                                left: [
                                    {
                                        type: 'description',
                                        value: (
                                            <Translation>
                                                {messages.TR_DEVICE_SETTINGS_PIN_PROTECTION_TITLE}
                                            </Translation>
                                        ),
                                    },
                                    {
                                        type: 'small-description',
                                        value: (
                                            <Translation
                                                {...messages.TR_DEVICE_SETTINGS_PIN_PROTECTION_DESC}
                                            />
                                        ),
                                    },
                                ],
                                right: [
                                    {
                                        type: 'switch',
                                        props: {
                                            checked: features.pin_protection,
                                            onChange: () =>
                                                changePin({ remove: !features.pin_protection }),
                                        },
                                    },
                                ],
                            },
                            {
                                left: [
                                    {
                                        type: 'description',
                                        value: (
                                            <Translation>
                                                {messages.TR_DEVICE_SETTINGS_PASSPHRASE_TITLE}
                                            </Translation>
                                        ),
                                    },
                                    {
                                        type: 'small-description',
                                        value: (
                                            <Translation>
                                                {messages.TR_DEVICE_SETTINGS_PASSPHRASE_DESC}
                                            </Translation>
                                        ),
                                    },
                                    {
                                        type: 'small-description',
                                        value: (
                                            <Translation>
                                                {messages.TR_DEVICE_SETTINGS_PASSPHRASE_DESC_MORE}
                                            </Translation>
                                        ),
                                    },
                                    {
                                        type: 'learn-more',
                                        href: PASSPHRASE_URL,
                                    },
                                ],
                                right: [
                                    {
                                        type: 'switch',
                                        props: {
                                            checked: features.passphrase_protection,
                                            onChange: () =>
                                                applySettings({
                                                    use_passphrase: !features.passphrase_protection,
                                                }),
                                        },
                                    },
                                ],
                            },
                        ] as const
                    }
                />

                <Section
                    controlsDisabled={uiLocked}
                    header="Personalization"
                    rows={
                        [
                            {
                                left: [
                                    {
                                        type: 'description',
                                        value: (
                                            <Translation>
                                                {messages.TR_DEVICE_SETTINGS_DEVICE_LABEL}
                                            </Translation>
                                        ),
                                    },
                                ],
                                right: [
                                    {
                                        type: 'input',
                                        props: {
                                            value: label,
                                            onChange: (event: React.FormEvent<HTMLInputElement>) =>
                                                setLabel(event.currentTarget.value),
                                        },
                                    },
                                    {
                                        type: 'button',
                                        value: (
                                            <Translation>
                                                {messages.TR_DEVICE_SETTINGS_DEVICE_EDIT_LABEL}
                                            </Translation>
                                        ),
                                        props: {
                                            onClick: () => applySettings({ label }),
                                        },
                                    },
                                ],
                            },
                            {
                                left: [
                                    {
                                        type: 'description',
                                        value: (
                                            <Translation>
                                                {messages.TR_DEVICE_SETTINGS_HOMESCREEN_TITLE}
                                            </Translation>
                                        ),
                                    },
                                    {
                                        type: 'small-description',
                                        value: (
                                            <Translation>
                                                {
                                                    messages.TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS
                                                }
                                            </Translation>
                                        ),
                                    },
                                ],
                                right: [
                                    {
                                        type: 'button',
                                        value: (
                                            <Translation>
                                                {
                                                    messages.TR_DEVICE_SETTINGS_HOMESCREEN_UPLOAD_IMAGE
                                                }
                                            </Translation>
                                        ),
                                        props: {
                                            onClick: () => console.log('todo'),
                                        },
                                    },
                                    {
                                        type: 'button',
                                        value: (
                                            <Translation>
                                                {
                                                    messages.TR_DEVICE_SETTINGS_HOMESCREEN_SELECT_FROM_GALLERY
                                                }
                                            </Translation>
                                        ),
                                        props: {
                                            onClick: () => openBackgroundGalleryModal(),
                                        },
                                    },
                                ],
                            },

                            {
                                hide: features.major_version !== 2,
                                left: [
                                    {
                                        type: 'description',
                                        value: (
                                            <Translation>
                                                {messages.TR_DEVICE_SETTINGS_DISPLAY_ROTATION}
                                            </Translation>
                                        ),
                                    },
                                ],
                                right: [
                                    {
                                        type: 'select',
                                        value: null,
                                        props: {
                                            options: DISPLAY_ROTATIONS.map(variant => ({
                                                label: variant.label,
                                                value: variant.value,
                                            })),
                                            // todo: this is not provided by device.features now
                                            value: null,
                                            onChange: (option: typeof DISPLAY_ROTATIONS[number]) =>
                                                applySettings({ display_rotation: option.value }),
                                        },
                                    },
                                ],
                            },
                        ] as const
                    }
                />

                <Section
                    controlsDisabled={uiLocked}
                    borderless
                    rows={
                        [
                            {
                                left: [
                                    {
                                        type: 'description',
                                        value: (
                                            <Translation>
                                                {messages.TR_DEVICE_SETTINGS_BUTTON_WIPE_DEVICE}
                                            </Translation>
                                        ),
                                    },
                                    {
                                        type: 'small-description',
                                        value: (
                                            <Translation>
                                                {messages.TR_WIPING_YOUR_DEVICE}
                                            </Translation>
                                        ),
                                    },
                                ],
                                right: [
                                    {
                                        type: 'button',
                                        value: (
                                            <Translation>
                                                {messages.TR_DEVICE_SETTINGS_BUTTON_WIPE_DEVICE}
                                            </Translation>
                                        ),
                                        props: {
                                            variant: 'danger',
                                            onClick: () => wipeDevice(),
                                        },
                                    },
                                ],
                            },
                        ] as const
                    }
                />
            </div>
        </SuiteLayout>
    );
};

export default Settings;
