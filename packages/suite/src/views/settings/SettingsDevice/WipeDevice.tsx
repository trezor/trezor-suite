import { SettingsSectionItem } from 'src/components/settings';
import { ActionButton, ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';

interface WipeDeviceProps {
    isDeviceLocked: boolean;
}

export const WipeDevice = ({ isDeviceLocked }: WipeDeviceProps) => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(openModal({ type: 'wipe-device' }));

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.WipeDevice}>
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_BUTTON_WIPE_DEVICE" />}
                description={<Translation id="TR_WIPING_YOUR_DEVICE" />}
            />
            <ActionColumn>
                <ActionButton
                    onClick={handleClick}
                    variant="destructive"
                    isDisabled={isDeviceLocked}
                    data-testid="@settings/device/open-wipe-modal-button"
                >
                    <Translation id="TR_DEVICE_SETTINGS_BUTTON_WIPE_DEVICE" />
                </ActionButton>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
