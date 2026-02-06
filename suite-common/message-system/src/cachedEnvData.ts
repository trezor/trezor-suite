import { getOsVersion } from '@suite-common/suite-utils';

let cachedOsVersion: Awaited<ReturnType<typeof getOsVersion>> | undefined;

/**
 * Caches env data that has to be fetched async and is necessary for message-system decisions,
 * so that message-system functions can be used synchronously.
 * Currently it's only the OS version on Suite Web/Desktop (but async fn also used on mobile for consistent type).
 */
export const prepareCachedEnvData = async () => {
    cachedOsVersion = await getOsVersion();
};

export const getCachedOsVersion = () => cachedOsVersion;
