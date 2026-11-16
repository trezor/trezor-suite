import { Column, Text } from '@trezor/components';
import { type Result } from '@trezor/type-utils';
import { bytesToHumanReadable } from '@trezor/utils';

import { type ServiceWorkerStatus } from '../../../control/serviceWorkerControl';

const getStateLabel = ({ isActive, isInstalling, isUpdateWaiting }: ServiceWorkerStatus) =>
    [isActive && 'active', isInstalling && 'installing', isUpdateWaiting && 'update waiting']
        .filter(label => label !== false)
        .join(', ') || 'none';

const getVersionLabel = ({ buildInfo }: ServiceWorkerStatus) =>
    buildInfo
        ? `${buildInfo.version ?? 'unknown'} (${buildInfo.commit ?? 'unknown commit'})`
        : 'unknown';

const getCachingLabel = ({ buildInfo }: ServiceWorkerStatus) => {
    if (!buildInfo) {
        return 'unknown';
    }

    return buildInfo.isCachingEnabled
        ? `${buildInfo.precachedEntryCount} precached files`
        : 'none in a dev build';
};

const getStorageUsageLabel = ({ storageUsage }: ServiceWorkerStatus) =>
    storageUsage === null ? 'unknown' : bytesToHumanReadable(storageUsage);

type ServiceWorkerStatusDetailsProps = {
    /** `null` until the first status arrives. */
    statusResult: Result<ServiceWorkerStatus | null, string> | null;
};

export const ServiceWorkerStatusDetails = ({ statusResult }: ServiceWorkerStatusDetailsProps) => {
    if (statusResult === null) {
        return <Text typographyStyle="body-sm">Checking the registration…</Text>;
    }

    if (!statusResult.success) {
        return (
            <Text typographyStyle="body-sm" intent="critical">
                Status unavailable: {statusResult.error}
            </Text>
        );
    }

    const status = statusResult.payload;

    if (status === null) {
        return <Text typographyStyle="body-sm">Not registered.</Text>;
    }

    return (
        <Column gap={4} alignItems="flex-start" data-testid="@settings/debug/service-worker/status">
            <Text typographyStyle="body-sm">State: {getStateLabel(status)}</Text>
            <Text typographyStyle="body-sm">Scope: {status.scope}</Text>
            <Text typographyStyle="body-sm">Version: {getVersionLabel(status)}</Text>
            <Text typographyStyle="body-sm">Caching: {getCachingLabel(status)}</Text>
            <Text typographyStyle="body-sm">
                Storage used by this origin: {getStorageUsageLabel(status)}
            </Text>
        </Column>
    );
};
