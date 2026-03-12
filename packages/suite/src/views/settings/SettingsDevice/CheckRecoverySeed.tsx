import { Translation } from '@suite/intl';
import { SettingsAnchor , goto } from '@suite/router';
import { getCheckBackupUrl } from '@suite-common/suite-utils';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { ActionButton, ActionColumn, TextColumn } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';

interface CheckRecoverySeedProps {
    isDeviceLocked: boolean;
}

export const CheckRecoverySeed = ({ isDeviceLocked }: CheckRecoverySeedProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    const needsBackup = device?.features?.backup_availability === 'Required';
    const learnMoreUrl = getCheckBackupUrl(device);

    const handleClick = () => dispatch(goto({ routeName: 'recovery-index', params: { cancelable: true } }));

    if (needsBackup) return null;

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.CheckRecoverySeed}>
            <TextColumn
                title={<Translation id="TR_CHECK_RECOVERY_SEED" />}
                description={<Translation id="TR_CHECK_RECOVERY_SEED_DESCRIPTION" />}
                buttonLink={learnMoreUrl}
            />
            <ActionColumn>
                <ActionButton
                    data-testid="@settings/device/check-seed-button"
                    onClick={handleClick}
                    isDisabled={isDeviceLocked}
                    intent="brand"
                    isTooltipActive={isDeviceLocked}
                    tooltipContent={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
                >
                    <Translation id="TR_CHECK_SEED" />
                </ActionButton>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
