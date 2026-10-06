import type { AppUpdateEvent } from '@suite/analytics';
import { type UpdateInfo } from '@suite/desktop-app-api';

type GetAppUpdatePayloadParams = {
    status: AppUpdateEvent['status'];
    earlyAccessProgram: boolean;
    updateInfo?: UpdateInfo;
    isAutoUpdated?: boolean;
};

export const getAppUpdatePayload = ({
    status,
    earlyAccessProgram,
    updateInfo,
    isAutoUpdated,
}: GetAppUpdatePayloadParams): AppUpdateEvent => ({
    fromVersion: process.env.VERSION || '',
    toVersion: updateInfo?.version,
    status,
    earlyAccessProgram,
    isPrerelease: updateInfo?.prerelease,
    isAutoUpdated,
});
