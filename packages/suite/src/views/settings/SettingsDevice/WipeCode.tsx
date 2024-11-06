import { useSelector } from 'react-redux';

import { analytics, EventType } from '@trezor/suite-analytics';
import { HELP_CENTER_WIPE_CODE_URL } from '@trezor/urls';
import { selectIsDeviceProtectedByWipeCode } from '@suite-common/wallet-core';

import { changeWipeCode } from 'src/actions/settings/deviceSettingsActions';
import { SettingsSectionItem } from 'src/components/settings';
import { ActionButton, ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch } from 'src/hooks/suite';

interface Props {
    isDeviceLocked: boolean;
}

export const WipeCode = ({ isDeviceLocked }: Props) => {
    const dispatch = useDispatch();
    const isDeviceProtectedByWipeCode = useSelector(selectIsDeviceProtectedByWipeCode);

    const enableWipeCode = () => {
        dispatch(changeWipeCode({ remove: false }));
        analytics.report({
            type: isDeviceProtectedByWipeCode
                ? EventType.SettingsDeviceChangeWipeCode
                : EventType.SettingsDeviceSetupWipeCode,
        });
    };

    const disableWipeCode = () => {
        dispatch(changeWipeCode({ remove: true }));
        analytics.report({
            type: EventType.SettingsDeviceDisableWipeCode,
        });
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.WipeCode}>
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_WIPE_CODE_TITLE" />}
                description={<Translation id="TR_DEVICE_SETTINGS_WIPE_CODE_DESC" />}
                buttonLink={HELP_CENTER_WIPE_CODE_URL}
            />

            <ActionColumn>
                <ActionButton
                    onClick={enableWipeCode}
                    isDisabled={isDeviceLocked}
                    variant="destructive"
                >
                    <Translation
                        id={
                            isDeviceProtectedByWipeCode
                                ? 'TR_CHANGE_WIPE_CODE'
                                : 'TR_SETUP_WIPE_CODE'
                        }
                    />
                </ActionButton>

                {isDeviceProtectedByWipeCode && (
                    <ActionButton
                        onClick={disableWipeCode}
                        isDisabled={isDeviceLocked}
                        variant="destructive"
                    >
                        <Translation id="TR_REMOVE_WIPE_CODE" />
                    </ActionButton>
                )}
            </ActionColumn>
        </SettingsSectionItem>
    );
};
