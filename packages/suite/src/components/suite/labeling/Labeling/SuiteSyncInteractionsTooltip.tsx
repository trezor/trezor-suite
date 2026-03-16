import { type ReactNode } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { selectDeviceByStaticSessionId, selectDeviceLabelOrNameById } from '@suite-common/device';
import { type SuiteSyncInteraction } from '@suite-common/suite-sync';
import { Text, Tooltip } from '@trezor/components';
import { type StaticSessionId } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import { useSelector } from '../../../../hooks/suite';

type LabelingDisabledTooltipProps = {
    suiteSyncInteraction: SuiteSyncInteraction | null;
    children: ReactNode;
    deviceStaticSessionId: StaticSessionId;
};

export const SuiteSyncInteractionsTooltip = ({
    suiteSyncInteraction,
    children,
    deviceStaticSessionId,
}: LabelingDisabledTooltipProps) => {
    const device = useSelector(state =>
        deviceStaticSessionId !== null
            ? selectDeviceByStaticSessionId(state, deviceStaticSessionId)
            : undefined,
    );

    const deviceLabel = useSelector(state =>
        device !== undefined ? selectDeviceLabelOrNameById(state, device.id) : null,
    );

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
                            <Translation
                                id={translationMap[suiteSyncInteraction]}
                                values={{ name: deviceLabel }}
                            />
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
