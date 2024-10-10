import { useState } from 'react';

import { Button, Switch } from '@trezor/components';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { manualFirmwareHashCheckThunk } from '@suite-common/wallet-core';
import { SUITE } from 'src/actions/suite/constants';

export const CheckFirmwareAuthenticity = () => {
    const [inProgress, setInProgress] = useState(false);

    const dispatch = useDispatch();
    const { isFirmwareHashCheckDisabled, isFirmwareRevisionCheckDisabled } = useSelector(
        state => state.suite.settings,
    );

    const onCheckFirmwareAuthenticity = async () => {
        setInProgress(true);
        await dispatch(manualFirmwareHashCheckThunk());
        setInProgress(false);
    };

    const onToggleFirmwareRevisionCheck = (newEnabledState?: boolean) =>
        dispatch({
            type: SUITE.DEVICE_FIRMWARE_REVISION_CHECK,
            payload: { isDisabled: !newEnabledState },
        });
    const onToggleFirmwareHashCheck = (newEnabledState?: boolean) =>
        dispatch({
            type: SUITE.DEVICE_FIRMWARE_HASH_CHECK,
            payload: { isDisabled: !newEnabledState },
        });

    return (
        <>
            <SectionItem data-testid="@settings/debug/check-firmware-authenticity">
                <TextColumn
                    title="Check firmware authenticity"
                    description="Download firmware binary from data.trezor.io and compare its hash with firmware hash provided by Trezor device."
                />
                <ActionColumn>
                    <Button
                        onClick={onCheckFirmwareAuthenticity}
                        isLoading={inProgress}
                        isDisabled={inProgress}
                    >
                        Check
                    </Button>
                </ActionColumn>
            </SectionItem>
            <SectionItem>
                <TextColumn
                    title="Check firmware Hash regularly"
                    description="Carry out firmware Hash check every time you authorize Trezor device. The toggle in Device settings controls both Hash & Revision check simultaneously."
                />
                <ActionColumn>
                    <Switch
                        onChange={onToggleFirmwareHashCheck}
                        isChecked={!isFirmwareHashCheckDisabled}
                    />
                </ActionColumn>
            </SectionItem>
            <SectionItem>
                <TextColumn
                    title="Check firmware Revision regularly"
                    description="Carry out firmware Revision check every time you authorize Trezor device. The toggle in Device settings controls both Hash & Revision check simultaneously."
                />
                <ActionColumn>
                    <Switch
                        onChange={onToggleFirmwareRevisionCheck}
                        isChecked={!isFirmwareRevisionCheckDisabled}
                    />
                </ActionColumn>
            </SectionItem>
        </>
    );
};
