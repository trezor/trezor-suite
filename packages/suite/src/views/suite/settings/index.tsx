import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { SUITE } from '@suite-actions/constants';
import { Input, Switch, Button, P, Icon, H2, H3, variables } from '@trezor/components';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { elementToHomescreen } from '@suite-utils/homescreen';
import { FormattedMessage } from 'react-intl';
import { SettingsLayout } from '@suite-components';
import messages from './index.messages';
import { homescreensT1, homescreensT2 } from '@suite-constants';

import { Props } from './Container';

type AnyImageName = typeof homescreensT1[number] | typeof homescreensT2[number];

const Row = styled.div`
    display: flex;
    flex-direction: ${(props: { isColumn?: boolean }) => (props.isColumn ? 'column' : 'row')};
    justify-content: space-between;
    margin: 15px 0 0 0;
    min-height: 45px;
`;

const Title = styled(H2)`
    display: flex;
    margin: 0;
    padding: 0;
    align-items: center;
`;

const StyledInput = styled(Input)`
    max-width: 100px;
`;

const LabelCol = styled.div`
    display: flex;
    flex: 1;
`;

const ActionColumn = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: flex-end;
`;

const Label = styled(H3)`
    display: flex;
    margin: 0;
    padding: 0;
    align-items: center;
`;

const Text = styled(P)`
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const ActionButton = styled(Button)`
    min-width: 150px;
`;

const OrientationButton = styled(Button)`
    margin-left: 3px;
    padding: 6px 12px;
`;

const BackgroundGallery = styled.div`
    display: flex;
    flex-wrap: wrap;
    padding-bottom: 24px;
`;

const BackgroundImageT2 = styled.img`
    border-radius: 50%;
    margin: 5px;
    width: 72px;
    height: 72px;
`;

const BackgroundImageT1 = styled.img`
    margin: 5px;
`;

const CloseButton = styled(Button)`
    padding: 0;
    margin: 0;
`;

const tr = messageId => <FormattedMessage {...messages[messageId]} />;

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
        <SettingsLayout>
            <Row>
                <Title>{tr('TR_DEVICE_SETTINGS_TITLE')}</Title>
                <CloseButton onClick={() => goto('wallet-index')} isTransparent>
                    <Icon icon="CLOSE" size={14} />
                </CloseButton>
            </Row>
            <Row>
                <Label>{tr('TR_DEVICE_SETTINGS_DEVICE_LABEL')}</Label>
                <ActionColumn>
                    <StyledInput
                        value={label}
                        onChange={(event: React.FormEvent<HTMLInputElement>) =>
                            setLabel(event.currentTarget.value)
                        }
                    />
                    <ActionButton isDisabled={uiLocked} onClick={() => applySettings({ label })}>
                        {tr('TR_DEVICE_SETTINGS_DEVICE_EDIT_LABEL')}
                    </ActionButton>
                </ActionColumn>
            </Row>
            <Row>
                <Label>{tr('TR_DEVICE_SETTINGS_PIN_PROTECTION_TITLE')}</Label>
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
            <Text>{tr('TR_DEVICE_SETTINGS_PIN_PROTECTION_DESC')}</Text>
            <Row>
                <Label>{tr('TR_DEVICE_SETTINGS_PASSPHRASE_TITLE')}</Label>
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
            <Text>{tr('TR_DEVICE_SETTINGS_PASSPHRASE_DESC')}</Text>
            <Text>{tr('TR_DEVICE_SETTINGS_PASSPHRASE_DESC_MORE')}</Text>
            {device.features.major_version === 2 && (
                <Row>
                    <LabelCol>
                        <Label>Display rotation</Label>
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
            <BackgroundGallery>
                {device.features.major_version === 1 &&
                    homescreensT1.map(image => (
                        <BackgroundImageT1
                            key={image}
                            id={image}
                            onClick={() => setHomescreen(image)}
                            src={resolveStaticPath(`images/suite/homescreens/t1/${image}.png`)}
                        />
                    ))}

                {device.features.major_version === 2 &&
                    homescreensT2.map(image => (
                        <BackgroundImageT2
                            key={image}
                            id={image}
                            onClick={() => setHomescreen(image)}
                            src={resolveStaticPath(`images/suite/homescreens/t2/${image}.png`)}
                        />
                    ))}
            </BackgroundGallery>
            <Row>
                <ActionColumn>
                    <ActionButton
                        isDisabled={uiLocked}
                        variant="error"
                        onClick={() => wipeDevice({ device })}
                    >
                        Wipe device
                    </ActionButton>
                </ActionColumn>
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
