import type { applyFlags } from './applyFlags';
import type { applySettings } from './applySettings';
import type { authenticateDevice } from './authenticateDevice';
import type { backupDevice } from './backupDevice';
import type { bleUnpair } from './bleUnpair';
import type { changeLanguage } from './changeLanguage';
import type { changePin } from './changePin';
import type { changeWipeCode } from './changeWipeCode';
import type { getFirmwareHash } from './getFirmwareHash';
import type { getNonce } from './getNonce';
import type { getSettings } from './getSettings';
import type { loadDevice } from './loadDevice';
import type { pingDevice } from './pingDevice';
import type { recoveryDevice } from './recoveryDevice';
import type { resetDevice } from './resetDevice';
import type { setBrightness } from './setBrightness';
import type { setBusy } from './setBusy';
import type { telemetryGet } from './telemetryGet';
import type { thpGetCredentials } from './thpGetCredentials';
import type { thpRemoveCredentials } from './thpRemoveCredentials';
import type { wipeDevice } from './wipeDevice';

// Device configuration, firmware, security, and hardware control
export interface TrezorConnectManagement {
    getFirmwareHash: typeof getFirmwareHash;
    resetDevice: typeof resetDevice;
    loadDevice: typeof loadDevice;
    recoveryDevice: typeof recoveryDevice;
    wipeDevice: typeof wipeDevice;
    backupDevice: typeof backupDevice;
    changePin: typeof changePin;
    changeWipeCode: typeof changeWipeCode;
    changeLanguage: typeof changeLanguage;
    applySettings: typeof applySettings;
    applyFlags: typeof applyFlags;
    authenticateDevice: typeof authenticateDevice;
    setBusy: typeof setBusy;
    setBrightness: typeof setBrightness;
    bleUnpair: typeof bleUnpair;
    thpGetCredentials: typeof thpGetCredentials;
    thpRemoveCredentials: typeof thpRemoveCredentials;
    telemetryGet: typeof telemetryGet;
    pingDevice: typeof pingDevice;
    getNonce: typeof getNonce;
    getSettings: typeof getSettings;
}
