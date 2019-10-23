import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { SUITE } from '@suite-actions/constants';
import { Input, Switch, Button, P, Icon, H2, H3, variables } from '@trezor/components';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { elementToHomescreen } from '@suite-utils/homescreen';
import { SettingsLayout } from '@suite-components';
import { Translation } from '@suite-components/Intl';
import messages from './index.messages';
import { homescreensT1, homescreensT2 } from '@suite-constants';

import { Props } from './Container';

type AnyImageName = typeof homescreensT1[number] | typeof homescreensT2[number];

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

const Title = styled(H2)`
    display: flex;
    margin: 0;
    padding: 0;
    align-items: center;
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

const Label = styled(H3)`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin: 0;
    padding: 0;
    align-items: center;
`;

const Text = styled(P)`
    font-size: ${variables.FONT_SIZE.SMALL};
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

const BackgroundGalleryT2 = styled.div`
    display: flex;
    flex-wrap: wrap;
    max-width: 200px;
    margin-right: 10px;
`;

const BackgroundGalleryT1 = styled.div`
    display: flex;
    flex-wrap: wrap;
    max-width: 490px;
    margin-right: 10px;
`;

const BackgroundImageT2 = styled.img`
    border-radius: 50%;
    margin: 5px;
    width: 30px;
    height: 30px;
    cursor: pointer;
`;

const BackgroundImageT1 = styled.img`
    margin: 5px;
    cursor: pointer;
    width: 64px;
    height: 32px;
`;

const CloseButton = styled(Button)`
    padding: 0;
    margin: 0;
    cursor: pointer;
`;

const Settings = ({ device, locks, applySettings, changePin, wipeDevice, goto }: Props) => {
    // todo: need to solve typescript here.

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

    const setHomescreen = (image: AnyImageName) => {
        const element = document.getElementById(image);
        if (element instanceof HTMLImageElement) {
            const hex = elementToHomescreen(element, features.major_version);
            applySettings({ homescreen: hex, device });
        }
    };

    const DISPLAY_ROTATIONS = [
        { icon: 'ARROW_UP', value: 0 },
        { icon: 'ARROW_RIGHT', value: 90 },
        { icon: 'ARROW_DOWN', value: 180 },
        { icon: 'ARROW_LEFT', value: 270 },
    ] as const;

    return (
        <SettingsLayout title="Settings">
            <Row>
                <Title>
                    <Translation>{messages.TR_DEVICE_SETTINGS_TITLE}</Translation>
                </Title>
                <CloseButton onClick={() => goto('wallet-index')} isTransparent>
                    <Icon icon="CLOSE" size={14} />
                </CloseButton>
            </Row>

            <Row>
                <Label>
                    <Translation>{messages.TR_DEVICE_SETTINGS_DEVICE_LABEL}</Translation>
                </Label>
                <ActionColumn>
                    <StyledInput
                        value={label}
                        onChange={(event: React.FormEvent<HTMLInputElement>) =>
                            setLabel(event.currentTarget.value)
                        }
                    />
                    <ActionButton isDisabled={uiLocked} onClick={() => applySettings({ label })}>
                        <Translation>{messages.TR_DEVICE_SETTINGS_DEVICE_EDIT_LABEL}</Translation>
                    </ActionButton>
                </ActionColumn>
            </Row>

            <Row>
                <Row isColumn marginTop="0">
                    <Label>
                        <Translation>{messages.TR_DEVICE_SETTINGS_HOMESCREEN_TITLE}</Translation>
                    </Label>
                    <Text>
                        <Translation>
                            {messages.TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS}
                        </Translation>
                    </Text>
                </Row>

                {device.features.major_version === 1 && (
                    <BackgroundGalleryT1>
                        {homescreensT1.map(image => (
                            <BackgroundImageT1
                                key={image}
                                id={image}
                                onClick={() => setHomescreen(image)}
                                src={resolveStaticPath(`images/suite/homescreens/t1/${image}.png`)}
                            />
                        ))}
                    </BackgroundGalleryT1>
                )}
                {device.features.major_version === 2 && (
                    <BackgroundGalleryT2>
                        {homescreensT2.map(image => (
                            <BackgroundImageT2
                                key={image}
                                id={image}
                                onClick={() => setHomescreen(image)}
                                src={resolveStaticPath(`images/suite/homescreens/t2/${image}.png`)}
                            />
                        ))}
                    </BackgroundGalleryT2>
                )}
                <ActionColumn>
                    <Row isColumn>
                        <ActionButtonColumn isDisabled onClick={() => applySettings({ label })}>
                            <Translation>
                                {messages.TR_DEVICE_SETTINGS_HOMESCREEN_UPLOAD_IMAGE}
                            </Translation>
                        </ActionButtonColumn>
                        <ActionButton isDisabled onClick={() => applySettings({ label })}>
                            <Translation>
                                {messages.TR_DEVICE_SETTINGS_HOMESCREEN_SELECT_FROM_GALLERY}
                            </Translation>
                        </ActionButton>
                    </Row>
                </ActionColumn>
            </Row>

            <Row>
                <Label>
                    <Translation>{messages.TR_DEVICE_SETTINGS_PIN_PROTECTION_TITLE}</Translation>
                </Label>
                <ActionColumn>
                    <Switch
                        checkedIcon={false}
                        uncheckedIcon={false}
                        onChange={checked => {
                            changePin({ remove: !checked });
                        }}
                        checked={features.pin_protection}
                    />
                </ActionColumn>
            </Row>
            <Text>
                <Translation>{messages.TR_DEVICE_SETTINGS_PIN_PROTECTION_DESC}</Translation>
            </Text>

            <Row>
                <Label>
                    <Translation>{messages.TR_DEVICE_SETTINGS_PASSPHRASE_TITLE}</Translation>
                </Label>
                <ActionColumn>
                    <Switch
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
            <Text>
                <Translation>{messages.TR_DEVICE_SETTINGS_PASSPHRASE_DESC}</Translation>
            </Text>
            <Text>
                <Translation>{messages.TR_DEVICE_SETTINGS_PASSPHRASE_DESC_MORE}</Translation>
            </Text>

            {device.features.major_version === 2 && (
                <Row>
                    <LabelCol>
                        <Label>
                            <Translation>
                                {messages.TR_DEVICE_SETTINGS_DISPLAY_ROTATION}
                            </Translation>
                        </Label>
                    </LabelCol>
                    <ActionColumn>
                        {DISPLAY_ROTATIONS.map(variant => (
                            <OrientationButton
                                key={variant.icon}
                                variant="white"
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
                <Label />
                <ActionButton
                    isDisabled={uiLocked}
                    variant="error"
                    onClick={() => wipeDevice({ device })}
                >
                    <Translation>{messages.TR_DEVICE_SETTINGS_BUTTON_WIPE_DEVICE}</Translation>
                </ActionButton>
            </Row>
            {/* TODO for both: { name: 'homescreen', type: 'string' }, custom load */}

            {/* TODO for T2: 
                { name: 'passphrase_source', type: 'number' }, is not in features, so probably skip for now ?
                { name: 'auto_lock_delay_ms', type: 'number' }, is not implemented, skip for now.
            */}
        </SettingsLayout>
    );
};

export default Settings;
