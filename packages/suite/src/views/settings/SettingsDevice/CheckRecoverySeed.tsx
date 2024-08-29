import { getCheckBackupUrl } from '@suite-common/suite-utils';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionButton, ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';

interface CheckRecoverySeedProps {
    isDeviceLocked: boolean;
}

export const CheckRecoverySeed = ({ isDeviceLocked }: CheckRecoverySeedProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    const needsBackup = device?.features?.backup_availability === 'Required';
    const learnMoreUrl = getCheckBackupUrl(device);

    const handleClick = () => dispatch(goto('recovery-index', { params: { cancelable: true } }));

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
                    isDisabled={isDeviceLocked || needsBackup}
                    variant="tertiary"
                >
                    <Translation id="TR_CHECK_SEED" />
                </ActionButton>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
