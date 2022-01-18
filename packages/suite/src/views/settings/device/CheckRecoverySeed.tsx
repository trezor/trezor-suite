import React from 'react';

import { Translation } from '@suite-components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { DRY_RUN_URL } from '@suite-constants/urls';
import { useDevice, useAnalytics, useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';

interface CheckRecoverySeedProps {
    isDeviceLocked: boolean;
}

export const CheckRecoverySeed = ({ isDeviceLocked }: CheckRecoverySeedProps) => {
    const { device } = useDevice();
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    const analytics = useAnalytics();

    const needsBackup = !!device?.features?.needs_backup;

    return (
        <SectionItem>
            <TextColumn
                title={<Translation id="TR_CHECK_RECOVERY_SEED" />}
                description={<Translation id="TR_CHECK_RECOVERY_SEED_DESCRIPTION" />}
                buttonLink={DRY_RUN_URL}
            />
            <ActionColumn>
                <ActionButton
                    data-test="@settings/device/check-seed-button"
                    onClick={() => {
                        goto('recovery-index', { cancelable: true });
                        analytics.report({
                            type: 'settings/device/goto/recovery',
                        });
                    }}
                    isDisabled={isDeviceLocked || needsBackup}
                    variant="secondary"
                >
                    <Translation id="TR_CHECK_SEED" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
