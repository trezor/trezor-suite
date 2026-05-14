import { type ReactNode } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { type SuiteSyncInteraction } from '@suite-common/suite-sync';
import { Text, Tooltip } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';

type LabelingDisabledTooltipProps = {
    suiteSyncInteraction: SuiteSyncInteraction | null;
    children: ReactNode;
};

export const SuiteSyncInteractionsTooltip = ({
    suiteSyncInteraction,
    children,
}: LabelingDisabledTooltipProps) => {
    if (suiteSyncInteraction === null) {
        return children;
    }

    const translationMap: Record<'firmware-upgrade-needed' | 'unsupported', TranslationKey> = {
        'firmware-upgrade-needed': 'FIRMWARE_NEEDS_UPGRADE_FOR_SUITE_SYNC',
        unsupported: 'FIRMWARE_UNSUPPORTED_DEVICE_SUITE_SYNC',
    };

    switch (suiteSyncInteraction) {
        case 'keys-needed':
        case 'suite-sync-off':
            // For disabled SuiteSync we allow editing as for Legacy devices user can
            // turn on the legacy labeling.

            return children;

        case 'firmware-upgrade-needed':
        case 'unsupported':
            return (
                <Tooltip
                    content={
                        <Text>
                            <Translation id={translationMap[suiteSyncInteraction]} />
                        </Text>
                    }
                >
                    {children}
                </Tooltip>
            );

        default:
            return exhaustive(suiteSyncInteraction);
    }
};
