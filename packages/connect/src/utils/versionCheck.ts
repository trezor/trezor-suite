import { isNewerOrEqual } from '@trezor/utils/src/versionUtils';

import { ConnectSettings } from '../types/settings';

export const isConnectOutdated = (settings?: ConnectSettings) => {
    // web only for now
    if (settings?.env !== 'web') return false;

    // npmVersion missing - pinned iframe version or core-in-popup.
    // we expect that if the version is pinned, the NPM version is equal to iframe version
    const version = settings.npmVersion || settings.version;
    if (!isNewerOrEqual(version, '9.2.1')) return 'error';
    if (!isNewerOrEqual(version, '9.5.0')) return 'warning';

    return false;
};
