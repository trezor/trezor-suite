import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { SettingsAnchor } from '@suite/router';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { ActionButton, ActionColumn, TextColumn } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

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
                    intent="brand"
                    onClick={handleClick}
                    data-testid="@settings/device/safety-checks-button"
                    isDisabled={isDeviceLocked}
                    isTooltipActive={isDeviceLocked}
                    tooltipContent={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
                >
                    <Translation id="TR_DEVICE_SETTINGS_SAFETY_CHECKS_BUTTON" />
                </ActionButton>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
