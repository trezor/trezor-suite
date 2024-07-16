import { Button, Switch } from '@trezor/components';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { setDebugMode } from 'src/actions/suite/suiteActions';
import { manualFirmwareHashCheckThunk } from '@suite-common/wallet-core';

export const CheckFirmwareAuthenticity = () => {
    const debug = useSelector(state => state.suite.settings.debug);
    const isLocked = useDevice().isLocked();

    const dispatch = useDispatch();

    const onChangeRegularCheck = (state?: boolean) =>
        dispatch(setDebugMode({ checkFirmwareAuthenticity: state }));

    const onCheckFirmwareAuthenticity = async () => {
        await dispatch(manualFirmwareHashCheckThunk());
    };

    return (
        <>
            <SectionItem data-test="@settings/debug/check-firmware-authenticity">
                <TextColumn
                    title="Check firmware authenticity"
                    description="Download firmware binary from data.trezor.io and compare its hash with firmware hash provided by Trezor device."
                />
                <ActionColumn>
                    <Button
                        onClick={onCheckFirmwareAuthenticity}
                        isLoading={isLocked}
                        isDisabled={isLocked}
                    >
                        Check
                    </Button>
                </ActionColumn>
            </SectionItem>
            <SectionItem data-test="@settings/debug/check-firmware-authenticity-on-connect/switch">
                <TextColumn
                    title="Check firmware authenticity regularly"
                    description="Carry out firmware authenticity check every time you authorize Trezor device"
                />
                <ActionColumn>
                    <Switch
                        onChange={onChangeRegularCheck}
                        isChecked={!!debug.checkFirmwareAuthenticity}
                    />
                </ActionColumn>
            </SectionItem>
        </>
    );
};
