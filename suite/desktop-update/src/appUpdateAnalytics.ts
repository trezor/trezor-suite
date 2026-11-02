import type { AppUpdatePayload } from '@suite/analytics';
import { type UpdateInfo } from '@suite/desktop-app-api';

type GetAppUpdatePayloadParams = {
    status: AppUpdatePayload['status'];
    earlyAccessProgram: boolean;
    updateInfo?: UpdateInfo;
    isAutoUpdated?: boolean;
};

export const getAppUpdatePayload = ({
    status,
    earlyAccessProgram,
    updateInfo,
    isAutoUpdated,
}: GetAppUpdatePayloadParams): AppUpdatePayload => ({
    fromVersion: process.env.VERSION || '',
    toVersion: updateInfo?.version,
    status,
    earlyAccessProgram,
    isPrerelease: updateInfo?.prerelease,
    isAutoUpdated,
});
