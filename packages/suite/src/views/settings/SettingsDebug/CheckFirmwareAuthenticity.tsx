import {
    selectAreDeviceMetaChecksEnabled,
    selectIsEntropyCheckEnabled,
    selectIsFirmwareHashCheckEnabled,
    selectIsFirmwareRevisionCheckEnabled,
    suiteSettingsActions,
} from '@suite/settings';
import { Switch } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { SectionItem } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from 'src/hooks/suite';

export const CheckFirmwareAuthenticity = () => {
    const { dispatch } = useServices(injectDispatch);
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
            <SectionItem
                title="Check entropy on wallet creation"
                description="Carry out entropy check when a wallet is created."
                actions={<Switch onChange={toggleEntropyCheck} isChecked={isEntropyCheckEnabled} />}
            />

            <SectionItem
                title="Check firmware Hash regularly"
                description="Carry out firmware hash check every time you authorize Trezor device."
                actions={
                    <Switch
                        onChange={toggleFirmwareHashCheck}
                        isChecked={isFirmwareHashCheckEnabled}
                    />
                }
            />

            <SectionItem
                title="Check firmware Revision regularly"
                description="Carry out firmware revision check every time you authorize Trezor device."
                actions={
                    <Switch
                        onChange={toggleFirmwareRevisionCheck}
                        isChecked={isFirmwareRevisionCheckEnabled}
                    />
                }
            />

            <SectionItem
                title="Perform device meta checks regularly"
                description="Carry out ID check & invariabilitiy check every time you authorize Trezor device."
                actions={
                    <Switch
                        onChange={toggleDeviceMetaChecks}
                        isChecked={areDeviceMetaChecksEnabled}
                    />
                }
            />
        </>
    );
};
