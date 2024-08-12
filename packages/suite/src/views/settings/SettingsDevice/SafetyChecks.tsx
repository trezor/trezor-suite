import { SettingsSectionItem } from 'src/components/settings';
import { ActionButton, ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';

interface SafetyChecksProps {
    isDeviceLocked: boolean;
}

export const SafetyChecks = ({ isDeviceLocked }: SafetyChecksProps) => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(openModal({ type: 'safety-checks' }));

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.SafetyChecks}>
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_SAFETY_CHECKS_TITLE" />}
                description={<Translation id="TR_DEVICE_SETTINGS_SAFETY_CHECKS_DESC" />}
            />
            <ActionColumn>
                <ActionButton
                    variant="secondary"
                    onClick={handleClick}
                    data-testid="@settings/device/safety-checks-button"
                    isDisabled={isDeviceLocked}
                >
                    <Translation id="TR_DEVICE_SETTINGS_SAFETY_CHECKS_BUTTON" />
                </ActionButton>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
