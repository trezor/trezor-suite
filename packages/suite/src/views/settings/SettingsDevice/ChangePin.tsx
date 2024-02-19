import { analytics, EventType } from '@trezor/suite-analytics';

import {
    ActionButton,
    ActionColumn,
    SectionItem,
    TextColumn,
    Translation,
} from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { changePin } from 'src/actions/settings/deviceSettingsActions';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

interface ChangePinProps {
    isDeviceLocked: boolean;
}

export const ChangePin = ({ isDeviceLocked }: ChangePinProps) => {
    const dispatch = useDispatch();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.ChangePin);

    const handleClick = () => {
        dispatch(changePin({ remove: false }));
        analytics.report({
            type: EventType.SettingsDeviceChangePin,
        });
    };

    return (
        <SectionItem
            data-test-id="@settings/device/change-pin"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_CHANGE_PIN_TITLE" />}
                description={<Translation id="TR_DEVICE_SETTINGS_CHANGE_PIN_DESC" />}
            />
            <ActionColumn>
                <ActionButton onClick={handleClick} isDisabled={isDeviceLocked} variant="secondary">
                    <Translation id="TR_CHANGE_PIN" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
