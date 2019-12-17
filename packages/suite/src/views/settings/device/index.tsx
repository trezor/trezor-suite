import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { SUITE } from '@suite-actions/constants';
import { Input, Switch, Icon } from '@trezor/components';
import { Button, P, H1, H2 } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { SuiteLayout, SettingsMenu } from '@suite-components';

import { Props } from './Container';

interface RowProps {
    isColumn?: boolean;
    marginTop?: string;
}

const Row = styled.div<RowProps>`
    display: flex;
    flex-direction: ${props => (props.isColumn ? 'column' : 'row')};
    justify-content: ${props => (props.isColumn ? 'default' : 'space-between')};
    margin: ${props => (props.marginTop ? `${props.marginTop}px 0 0 0` : '20px 0 0 0')};
    min-height: 45px;
`;

const StyledInput = styled(Input)`
    padding-right: 20px;
`;

const LabelCol = styled.div`
    display: flex;
    flex: 1;
`;

const ActionColumn = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
`;

const ActionButton = styled(Button)`
    min-width: 170px;
`;

const ActionButtonColumn = styled(ActionButton)`
    margin-bottom: 5px;
`;

const OrientationButton = styled(Button)`
    margin-left: 3px;
`;

const CloseButton = styled(Button)`
    padding: 0;
    margin: 0;
    cursor: pointer;
`;

const Settings = ({
    device,
    locks,
    applySettings,
    changePin,
    wipeDevice,
    goto,
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
        { icon: 'ARROW_UP', value: 0 },
        { icon: 'ARROW_RIGHT', value: 90 },
        { icon: 'ARROW_DOWN', value: 180 },
        { icon: 'ARROW_LEFT', value: 270 },
    ] as const;

    console.log('render');

    return (
        <SuiteLayout title="Settings" secondaryMenu={<SettingsMenu />}>
            <Row>
                <H1 textAlign="center">
                    <Translation>{messages.TR_DEVICE_SETTINGS_TITLE}</Translation>
                </H1>
                <CloseButton onClick={() => goto('wallet-index')} variant="tertiary">
                    <Icon icon="CLOSE" size={14} />
                </CloseButton>
            </Row>

            <Row>
                <H2 textAlign="center">
                    <Translation>{messages.TR_DEVICE_SETTINGS_DEVICE_LABEL}</Translation>
                </H2>
                <ActionColumn>
                    <StyledInput
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
                        <Translation>{messages.TR_DEVICE_SETTINGS_DEVICE_EDIT_LABEL}</Translation>
                    </ActionButton>
                </ActionColumn>
            </Row>

            <Row>
                <Row isColumn marginTop="0">
                    <H2 textAlign="center">
                        <Translation>{messages.TR_DEVICE_SETTINGS_HOMESCREEN_TITLE}</Translation>
                    </H2>
                    <P size="small">
                        <Translation>
                            {messages.TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS}
                        </Translation>
                    </P>
                </Row>

                <ActionColumn>
                    <Row isColumn>
                        <ActionButtonColumn isDisabled onClick={() => applySettings({ label })}>
                            <Translation>
                                {messages.TR_DEVICE_SETTINGS_HOMESCREEN_UPLOAD_IMAGE}
                            </Translation>
                        </ActionButtonColumn>
                        <ActionButton onClick={() => openBackgroundGalleryModal()}>
                            <Translation>
                                {messages.TR_DEVICE_SETTINGS_HOMESCREEN_SELECT_FROM_GALLERY}
                            </Translation>
                        </ActionButton>
                    </Row>
                </ActionColumn>
            </Row>

            <Row>
                <H2 textAlign="center">
                    <Translation>{messages.TR_DEVICE_SETTINGS_PIN_PROTECTION_TITLE}</Translation>
                </H2>
                <ActionColumn>
                    <Switch
                        data-test="@suite/settings/device/pin-switch"
                        checkedIcon={false}
                        uncheckedIcon={false}
                        onChange={checked => {
                            changePin({ remove: !checked });
                        }}
                        checked={features.pin_protection}
                    />
                </ActionColumn>
            </Row>
            <P size="small">
                <Translation>{messages.TR_DEVICE_SETTINGS_PIN_PROTECTION_DESC}</Translation>
            </P>

            <Row>
                <H2 textAlign="center">
                    <Translation>{messages.TR_DEVICE_SETTINGS_PASSPHRASE_TITLE}</Translation>
                </H2>
                <ActionColumn>
                    <Switch
                        data-test="@suite/settings/device/passphrase-switch"
                        checkedIcon={false}
                        uncheckedIcon={false}
                        onChange={checked => {
                            /* eslint-disable-next-line @typescript-eslint/camelcase */
                            applySettings({ use_passphrase: checked });
                        }}
                        checked={features.passphrase_protection}
                    />
                </ActionColumn>
            </Row>
            <P size="small">
                <Translation>{messages.TR_DEVICE_SETTINGS_PASSPHRASE_DESC}</Translation>
            </P>
            <P size="small">
                <Translation>{messages.TR_DEVICE_SETTINGS_PASSPHRASE_DESC_MORE}</Translation>
            </P>

            {device.features.major_version === 2 && (
                <Row>
                    <LabelCol>
                        <H2 textAlign="center">
                            <Translation>
                                {messages.TR_DEVICE_SETTINGS_DISPLAY_ROTATION}
                            </Translation>
                        </H2>
                    </LabelCol>
                    <ActionColumn>
                        {DISPLAY_ROTATIONS.map(variant => (
                            <OrientationButton
                                isDisabled={uiLocked}
                                key={variant.icon}
                                variant="secondary"
                                onClick={() =>
                                    /* eslint-disable-next-line @typescript-eslint/camelcase */
                                    applySettings({ display_rotation: variant.value })
                                }
                            >
                                <Icon size={14} icon={variant.icon} />
                            </OrientationButton>
                        ))}
                    </ActionColumn>
                </Row>
            )}
            <Row>
                <ActionButton isDisabled={uiLocked} variant="danger" onClick={() => wipeDevice()}>
                    <Translation>{messages.TR_DEVICE_SETTINGS_BUTTON_WIPE_DEVICE}</Translation>
                </ActionButton>
            </Row>
            {/* TODO for both: { name: 'homescreen', type: 'string' }, custom load */}

            {/* TODO for T2: 
                { name: 'passphrase_source', type: 'number' }, is not in features, so probably skip for now ?
                { name: 'auto_lock_delay_ms', type: 'number' }, is not implemented, skip for now.
            */}
        </SuiteLayout>
    );
};

export default Settings;
