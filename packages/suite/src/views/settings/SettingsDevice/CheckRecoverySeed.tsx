import { getCheckBackupUrl } from '@suite-common/suite-utils';

import {
    ActionButton,
    ActionColumn,
    SectionItem,
    TextColumn,
    Translation,
} from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

interface CheckRecoverySeedProps {
    isDeviceLocked: boolean;
}

export const CheckRecoverySeed = ({ isDeviceLocked }: CheckRecoverySeedProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.CheckRecoverySeed);

    const needsBackup = !!device?.features?.needs_backup;
    const learnMoreUrl = getCheckBackupUrl(device);

    const handleClick = () => dispatch(goto('recovery-index', { params: { cancelable: true } }));

    return (
        <SectionItem
            data-test="@settings/device/check-recovery-seed"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_CHECK_RECOVERY_SEED" />}
                description={<Translation id="TR_CHECK_RECOVERY_SEED_DESCRIPTION" />}
                buttonLink={learnMoreUrl}
            />
            <ActionColumn>
                <ActionButton
                    data-test="@settings/device/check-seed-button"
                    onClick={handleClick}
                    isDisabled={isDeviceLocked || needsBackup}
                    variant="secondary"
                >
                    <Translation id="TR_CHECK_SEED" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
