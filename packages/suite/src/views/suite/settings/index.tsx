/* eslint-disable @typescript-eslint/camelcase */
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { back } from '@suite-actions/routerActions';
import { SUITE } from '@suite-actions/constants';
import { Input, Button, P, Icon } from '@trezor/components';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { elementToHomescreen } from '@suite-utils/homescreen';

import { homescreensT1, homescreensT2 } from '@suite-constants';

import { Props } from './Container';

type AnyImageName = typeof homescreensT1[number] | typeof homescreensT2[number];

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    padding-top: 30px;
    width: 100%;
    max-width: 500px;
`;

const Row = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 10px;
    justify-content: space-between;
`;

const LabelCol = styled.div`
    display: flex;
    flex: 1;
`;

const ValueCol = styled.div`
    display: flex;
    flex: 1;
`;

const ActionCol = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-end;
`;

const Label = styled(P)``;

const ActionButton = styled(Button)`
    padding: 11px 12px;
    min-width: 100px;
`;

const OrientationButton = styled(Button)`
    margin-left: 3px;
    padding: 2px 8px;
`;

const BackgroundGallery = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
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

const Settings = ({ device, locks, applySettings, changePin }: Props) => {
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
        // blocked by components
        { icon: 'ARROW_RIGHT', value: 90 },
        { icon: 'ARROW_DOWN', value: 180 },
        { icon: 'ARROW_LEFT', value: 270 },
    ] as const;

    return (
        <Wrapper>
            <Row>
                <ActionButton isDisabled={uiLocked} isWhite onClick={back}>
                    BACK
                </ActionButton>
            </Row>
            <Row>
                <LabelCol>
                    <Label>Label</Label>
                </LabelCol>
                <ValueCol>
                    <Input
                        value={label}
                        onChange={(event: React.FormEvent<HTMLInputElement>) =>
                            setLabel(event.currentTarget.value)
                        }
                    />
                </ValueCol>
                <ActionCol>
                    <ActionButton
                        isDisabled={uiLocked}
                        isWhite
                        onClick={() => applySettings({ label })}
                    >
                        change
                    </ActionButton>
                </ActionCol>
            </Row>

            <Row>
                <LabelCol>
                    <Label>Pin protection</Label>
                </LabelCol>
                <ValueCol>
                    <P>{features.pin_protection ? 'enabled' : 'disabled'}</P>
                </ValueCol>
                <ActionCol>
                    {!features.pin_protection && (
                        <ActionButton
                            isDisabled={uiLocked}
                            isWhite
                            onClick={() => changePin({ device })}
                        >
                            enable
                        </ActionButton>
                    )}
                    {features.pin_protection && (
                        <ActionButton
                            isDisabled={uiLocked}
                            isWhite
                            onClick={() => changePin({ remove: true, device })}
                        >
                            disable
                        </ActionButton>
                    )}
                </ActionCol>
            </Row>

            <Row>
                <LabelCol>
                    <Label>Passphrase protection</Label>
                </LabelCol>
                <ValueCol>
                    <P>{features.passphrase_protection ? 'enabled' : 'disabled'}</P>
                </ValueCol>
                <ActionCol>
                    {!features.passphrase_protection && (
                        <ActionButton
                            isDisabled={uiLocked}
                            isWhite
                            onClick={() => applySettings({ use_passphrase: true })}
                        >
                            enable
                        </ActionButton>
                    )}
                    {features.passphrase_protection && (
                        <ActionButton
                            isDisabled={uiLocked}
                            isWhite
                            onClick={() => applySettings({ use_passphrase: false })}
                        >
                            disable
                        </ActionButton>
                    )}
                </ActionCol>
            </Row>

            {device.features.major_version === 2 && (
                <>
                    <Row>
                        <LabelCol>
                            <Label>Display rotation</Label>
                        </LabelCol>
                        <ActionCol>
                            {DISPLAY_ROTATIONS.map(variant => (
                                <OrientationButton
                                    key={variant.icon}
                                    isWhite
                                    onClick={() =>
                                        applySettings({ display_rotation: variant.value })
                                    }
                                >
                                    <Icon icon={variant.icon} />
                                </OrientationButton>
                            ))}
                        </ActionCol>
                    </Row>
                </>
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
            {/* 
                TODO for both:
                { name: 'homescreen', type: 'string' }, custom load
            */}

            {/* 
                TODO for T2
                { name: 'passphrase_source', type: 'number' }, is not in features, so probably skip for now
                ?{ name: 'auto_lock_delay_ms', type: 'number' }, is not implemented, skip for now.
            */}
        </Wrapper>
    );
};

export default Settings;
