import type { AppUpdateEvent } from '@suite/analytics';
import { type UpdateInfo } from '@suite/desktop-app-api';

export const getAppUpdatePayload = ({
    status,
    earlyAccessProgram,
    updateInfo,
    isAutoUpdated,
}: {
    status: AppUpdateEvent['status'];
    earlyAccessProgram: boolean;
    updateInfo?: UpdateInfo;
    isAutoUpdated?: boolean;
}): AppUpdateEvent => ({
    fromVersion: process.env.VERSION || '',
    toVersion: updateInfo?.version,
    status,
    earlyAccessProgram,
    isPrerelease: updateInfo?.prerelease,
    isAutoUpdated,
});
