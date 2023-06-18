import React from 'react';

import { Translation } from 'src/components/suite';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from 'src/components/suite/Settings';
import { useDevice, useActions } from 'src/hooks/suite';
import * as routerActions from 'src/actions/suite/routerActions';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { getCheckBackupUrl } from 'src/utils/suite/device';

interface CheckRecoverySeedProps {
    isDeviceLocked: boolean;
}

export const CheckRecoverySeed = ({ isDeviceLocked }: CheckRecoverySeedProps) => {
    const { device } = useDevice();
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.CheckRecoverySeed);

    const needsBackup = !!device?.features?.needs_backup;
    const learnMoreUrl = getCheckBackupUrl(device);

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
                    onClick={() => goto('recovery-index', { params: { cancelable: true } })}
                    isDisabled={isDeviceLocked || needsBackup}
                    variant="secondary"
                >
                    <Translation id="TR_CHECK_SEED" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
