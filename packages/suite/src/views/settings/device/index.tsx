/* eslint-disable @typescript-eslint/camelcase */
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { SUITE } from '@suite-actions/constants';
import { Select, variables as oldVariables } from '@trezor/components';
import { Input, Button, Switch, P, H2, Link, colors, variables } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { SuiteLayout, SettingsMenu } from '@suite-components';
import { getFwVersion } from '@suite-utils/device';

import { Props } from './Container';
import { SEED_MANUAL_URL } from '@onboarding-constants/urls';
import { DRY_RUN_URL, PASSPHRASE_URL } from '@suite-constants/urls';

const { SCREEN_SIZE } = oldVariables;

const ActionButton = styled(Button)`
    min-width: 170px;
    margin-left: 10px;

    @media all and (max-width: ${SCREEN_SIZE.SM}) {
        min-width: 100%;
        margin: 5px 0;
    }
`;

const Section = styled.div`
    border: 1px solid ${colors.BLACK96};
    border-radius: 6px;
    margin-top: 16px;
    margin-bottom: 30px;
`;

const SectionHeader = styled(P)`
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.BOLD};
`;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    border-top: 1px solid ${colors.BLACK96};
    border-bottom: 1px solid ${colors.BLACK96};
    padding: 28px 24px;

    @media all and (max-width: ${SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

const TextColumn = styled.div`
    display: flex;
    /* flex: 3; */
    flex-direction: column;
`;

const SmallDescription = styled(P)`
    color: ${colors.BLACK50};
    margin: 4px 16px 4px 0;
    font-size: ${variables.FONT_SIZE.TINY};
`;

const LearnMoreWrapper = styled(Link)`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK17};
`;

const LearnMore = ({ href }: { href: string }) => (
    <LearnMoreWrapper href={href}>
        <Translation>{messages.TR_LEARN_MORE_LINK}</Translation>
    </LearnMoreWrapper>
);

const Description = styled(P)`
    line-height: 1.29;
`;

const ActionColumn = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;

    @media all and (max-width: ${SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

const ActionInput = styled(Input)`
    width: 170px;
    @media all and (max-width: ${SCREEN_SIZE.SM}) {
        min-width: 100%;
        margin: 5px 0;
    }
`;

const ActionSelect = styled(Select)`
    width: 170px;
    @media all and (max-width: ${SCREEN_SIZE.SM}) {
        min-width: 100%;
        margin: 5px 0;
    }
`;

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
                <SectionHeader>
                    <Translation>{messages.TR_BACKUP}</Translation>
                </SectionHeader>
                <Section>
                    <Row>
                        <TextColumn>
                            <Description>
                                <Translation>{messages.TR_BACKUP_RECOVERY_SEED}</Translation>
                            </Description>
                            <SmallDescription>
                                <Translation>{messages.TR_RECOVERY_SEED_IS}</Translation>
                            </SmallDescription>
                            <LearnMore href={SEED_MANUAL_URL} />
                        </TextColumn>
                        <ActionColumn>
                            <ActionButton>
                                <Translation>{messages.TR_CREATE_BACKUP}</Translation>
                            </ActionButton>
                        </ActionColumn>
                    </Row>
                    <Row>
                        <TextColumn>
                            <Description>
                                <Translation>{messages.TR_CHECK_RECOVERY_SEED}</Translation>
                            </Description>
                            <SmallDescription>
                                <Translation>{messages.TR_RECOVERY_SEED_IS}</Translation>
                            </SmallDescription>
                            <LearnMore href={DRY_RUN_URL} />
                        </TextColumn>
                        <ActionColumn>
                            <ActionButton>
                                <Translation>{messages.TR_CHECK_SEED}</Translation>
                            </ActionButton>
                        </ActionColumn>
                    </Row>
                </Section>
                <SectionHeader>Security</SectionHeader>
                <Section>
                    <Row>
                        <TextColumn>
                            <Description>
                                <Translation>{messages.TR_FIRMWARE_VERSION}</Translation>
                            </Description>
                            <SmallDescription>
                                <Translation
                                    values={{ version: getFwVersion(device) }}
                                    {...messages.TR_YOUR_CURRENT_FIRMWARE}
                                />
                            </SmallDescription>
                        </TextColumn>
                        <ActionColumn>
                            <ActionButton>Check for update</ActionButton>
                        </ActionColumn>
                    </Row>
                    <Row>
                        <TextColumn>
                            <Description>
                                <Translation>
                                    {messages.TR_DEVICE_SETTINGS_PIN_PROTECTION_TITLE}
                                </Translation>
                            </Description>
                            <SmallDescription>
                                <Translation {...messages.TR_DEVICE_SETTINGS_PIN_PROTECTION_DESC} />
                            </SmallDescription>
                        </TextColumn>
                        <ActionColumn>
                            <Switch
                                // todo: switch does not support isDisabled
                                // isDisabled={uiLocked}
                                checked={features.pin_protection}
                                onChange={() => changePin({ remove: !features.pin_protection })}
                            />
                        </ActionColumn>
                    </Row>

                    <Row>
                        <TextColumn>
                            <Description>
                                <Translation>
                                    {messages.TR_DEVICE_SETTINGS_PASSPHRASE_TITLE}
                                </Translation>
                            </Description>
                            <SmallDescription>
                                <Translation>
                                    {messages.TR_DEVICE_SETTINGS_PASSPHRASE_DESC}
                                </Translation>
                            </SmallDescription>
                            <SmallDescription>
                                <Translation>
                                    {messages.TR_DEVICE_SETTINGS_PASSPHRASE_DESC_MORE}
                                </Translation>
                            </SmallDescription>
                            <LearnMore href={PASSPHRASE_URL} />
                        </TextColumn>
                        <ActionColumn>
                            <Switch
                                // todo: switch does not support isDisabled
                                // isDisabled={uiLocked}
                                checked={features.passphrase_protection}
                                onChange={() =>
                                    applySettings({
                                        use_passphrase: !features.passphrase_protection,
                                    })
                                }
                            />
                        </ActionColumn>
                    </Row>
                </Section>

                <SectionHeader>Personalization</SectionHeader>
                <Section>
                    <Row>
                        <TextColumn>
                            <Description>
                                <Translation>
                                    {messages.TR_DEVICE_SETTINGS_DEVICE_LABEL}
                                </Translation>
                            </Description>
                        </TextColumn>
                        <ActionColumn>
                            <ActionInput
                                data-test="@suite/settings/device/label-input"
                                isDisabled={uiLocked}
                                value={label}
                                onChange={(event: React.FormEvent<HTMLInputElement>) =>
                                    setLabel(event.currentTarget.value)
                                }
                            />
                            <ActionButton
                                isDisabled={uiLocked}
                                onClick={() => applySettings({ label })}
                                data-test="@suite/settings/device/label-submit"
                            >
                                <Translation>
                                    {messages.TR_DEVICE_SETTINGS_DEVICE_EDIT_LABEL}
                                </Translation>
                            </ActionButton>
                        </ActionColumn>
                    </Row>

                    <Row>
                        <TextColumn>
                            <Description>
                                <Translation>
                                    {messages.TR_DEVICE_SETTINGS_HOMESCREEN_TITLE}
                                </Translation>
                            </Description>

                            <SmallDescription>
                                <Translation>
                                    {messages.TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS}
                                </Translation>
                            </SmallDescription>
                        </TextColumn>

                        <ActionColumn>
                            <ActionButton isDisabled onClick={() => console.log('todo')}>
                                <Translation>
                                    {messages.TR_DEVICE_SETTINGS_HOMESCREEN_UPLOAD_IMAGE}
                                </Translation>
                            </ActionButton>
                            <ActionButton onClick={() => openBackgroundGalleryModal()}>
                                <Translation>
                                    {messages.TR_DEVICE_SETTINGS_HOMESCREEN_SELECT_FROM_GALLERY}
                                </Translation>
                            </ActionButton>
                        </ActionColumn>
                    </Row>

                    {features.major_version === 2 && (
                        <Row>
                            <TextColumn>
                                <Description>
                                    <Translation>
                                        {messages.TR_DEVICE_SETTINGS_DISPLAY_ROTATION}
                                    </Translation>
                                </Description>
                            </TextColumn>
                            <ActionColumn>
                                <ActionSelect
                                    options={DISPLAY_ROTATIONS.map(variant => ({
                                        label: variant.label,
                                        value: variant.value,
                                    }))}
                                    // todo: this is not provided by device.features now
                                    value={null}
                                    onChange={(option: typeof DISPLAY_ROTATIONS[number]) =>
                                        applySettings({ display_rotation: option.value })
                                    }
                                />
                            </ActionColumn>
                        </Row>
                    )}
                </Section>

                <Section>
                    <Row>
                        <TextColumn>
                            <Description>
                                <Translation>
                                    {messages.TR_DEVICE_SETTINGS_BUTTON_WIPE_DEVICE}
                                </Translation>
                            </Description>
                            <SmallDescription>
                                <Translation>{messages.TR_WIPING_YOUR_DEVICE}</Translation>
                            </SmallDescription>
                        </TextColumn>
                        <ActionColumn>
                            <ActionButton
                                isDisabled={uiLocked}
                                variant="danger"
                                onClick={() => wipeDevice()}
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
