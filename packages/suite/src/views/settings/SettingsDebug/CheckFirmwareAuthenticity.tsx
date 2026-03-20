import {
    selectAreDeviceMetaChecksEnabled,
    selectIsEntropyCheckEnabled,
    selectIsFirmwareHashCheckEnabled,
    selectIsFirmwareRevisionCheckEnabled,
    suiteSettingsActions,
} from '@suite/settings';
import { Switch } from '@trezor/components';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const CheckFirmwareAuthenticity = () => {
    const dispatch = useDispatch();
    const isEntropyCheckEnabled = useSelector(selectIsEntropyCheckEnabled);
    const isFirmwareHashCheckEnabled = useSelector(selectIsFirmwareHashCheckEnabled);
    const isFirmwareRevisionCheckEnabled = useSelector(selectIsFirmwareRevisionCheckEnabled);
    const areDeviceMetaChecksEnabled = useSelector(selectAreDeviceMetaChecksEnabled);

    const toggleEntropyCheck = (isChecked: boolean) =>
        dispatch(suiteSettingsActions.toggleEntropyCheck(isChecked));
    const toggleFirmwareHashCheck = (isChecked: boolean) =>
        dispatch(suiteSettingsActions.toggleFirmwareHashCheck(isChecked));
    const toggleFirmwareRevisionCheck = (isChecked: boolean) =>
        dispatch(suiteSettingsActions.toggleFirmwareRevisionCheck(isChecked));
    const toggleDeviceMetaChecks = (isChecked: boolean) =>
        dispatch(suiteSettingsActions.toggleDeviceMetaChecks(isChecked));

    return (
        <>
            <SectionItem>
                <TextColumn
                    title="Check entropy on wallet creation"
                    description="Carry out entropy check when a wallet is created."
                />
                <ActionColumn>
                    <Switch onChange={toggleEntropyCheck} isChecked={isEntropyCheckEnabled} />
                </ActionColumn>
            </SectionItem>
            <SectionItem>
                <TextColumn
                    title="Check firmware Hash regularly"
                    description="Carry out firmware hash check every time you authorize Trezor device."
                />
                <ActionColumn>
                    <Switch
                        onChange={toggleFirmwareHashCheck}
                        isChecked={isFirmwareHashCheckEnabled}
                    />
                </ActionColumn>
            </SectionItem>
            <SectionItem>
                <TextColumn
                    title="Check firmware Revision regularly"
                    description="Carry out firmware revision check every time you authorize Trezor device."
                />
                <ActionColumn>
                    <Switch
                        onChange={toggleFirmwareRevisionCheck}
                        isChecked={isFirmwareRevisionCheckEnabled}
                    />
                </ActionColumn>
            </SectionItem>
            <SectionItem>
                <TextColumn
                    title="Perform device meta checks regularly"
                    description="Carry out ID check & invariabilitiy check every time you authorize Trezor device."
                />
                <ActionColumn>
                    <Switch
                        onChange={toggleDeviceMetaChecks}
                        isChecked={areDeviceMetaChecksEnabled}
                    />
                </ActionColumn>
            </SectionItem>
        </>
    );
};
