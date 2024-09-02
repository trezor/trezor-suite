import { analytics, EventType } from '@trezor/suite-analytics';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionButton, ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { changePin } from 'src/actions/settings/deviceSettingsActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';

interface ChangePinProps {
    isDeviceLocked: boolean;
}

export const ChangePin = ({ isDeviceLocked }: ChangePinProps) => {
    const dispatch = useDispatch();

    const handleClick = () => {
        dispatch(changePin({ remove: false }));
        analytics.report({
            type: EventType.SettingsDeviceChangePin,
        });
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.ChangePin}>
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_CHANGE_PIN_TITLE" />}
                description={<Translation id="TR_DEVICE_SETTINGS_CHANGE_PIN_DESC" />}
            />
            <ActionColumn>
                <ActionButton onClick={handleClick} isDisabled={isDeviceLocked} variant="primary">
                    <Translation id="TR_CHANGE_PIN" />
                </ActionButton>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
