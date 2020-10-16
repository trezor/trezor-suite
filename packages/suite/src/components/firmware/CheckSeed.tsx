import React from 'react';
import styled from 'styled-components';

import { Button, Checkbox, colors } from '@trezor/components';
import { useDevice, useFirmware } from '@suite-hooks';
import { Translation } from '@suite-components';
import { P, H2, WarningImg, SeedImg, ReconnectInNormalStep } from '@firmware-components';

const CheckboxRow = styled.div`
    display: flex;
    flex-direction: row;
    border-top: 1px solid ${colors.NEUE_STROKE_GREY};
    width: 380px;
    padding: 20px 0;
    justify-content: center;
    margin: 28px auto 0 auto;
`;

const Body = () => {
    const { device } = useDevice();
    const { toggleHasSeed, hasSeed } = useFirmware();

    // unacquired device handled on higher level
    if (!device?.features) return null;

    // ensure that device is connected in requested mode
    if (device.mode !== 'normal') return <ReconnectInNormalStep.Body />;

    // device is not backed up - it is not advisable to do firmware update
    if (device.features.needs_backup || device.features.unfinished_backup) {
        return (
            <>
                <WarningImg />
                <H2>
                    <Translation
                        id="TR_DEVICE_LABEL_IS_NOT_BACKED_UP"
                        values={{ deviceLabel: device.label }}
                    />
                </H2>
                <P>
                    <Translation id="TR_FIRMWARE_IS_POTENTIALLY_RISKY" />
                </P>
                <CheckboxRow>
                    <Checkbox
                        isChecked={hasSeed}
                        onClick={toggleHasSeed}
                        data-test="@firmware/confirm-seed-checkbox"
                    >
                        <P>
                            <Translation id="FIRMWARE_USER_TAKES_RESPONSIBILITY_CHECKBOX_DESC" />
                        </P>
                    </Checkbox>
                </CheckboxRow>
            </>
        );
    }

    // expected flow - device is backed up
    return (
        <>
            <SeedImg />
            <H2>
                <Translation id="TR_SECURITY_CHECKPOINT_GOT_SEED" />
            </H2>
            <P>
                <Translation id="TR_BEFORE_ANY_FURTHER_ACTIONS" />
            </P>
            <CheckboxRow>
                <Checkbox
                    isChecked={hasSeed}
                    onClick={toggleHasSeed}
                    data-test="@firmware/confirm-seed-checkbox"
                >
                    <P>
                        <Translation id="FIRMWARE_USER_HAS_SEED_CHECKBOX_DESC" />
                    </P>
                </Checkbox>
            </CheckboxRow>
        </>
    );
};

const BottomBar = () => {
    const { device } = useDevice();
    const { hasSeed, setStatus } = useFirmware();

    return (
        <Button
            onClick={() => setStatus('waiting-for-bootloader')}
            data-test="@firmware/confirm-seed-button"
            isDisabled={!device?.connected || device.mode === 'bootloader' || !hasSeed}
        >
            <Translation id="TR_CONTINUE" />
        </Button>
    );
};

export const CheckSeedStep = {
    Body,
    BottomBar,
};
