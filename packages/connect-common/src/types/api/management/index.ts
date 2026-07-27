import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

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
export const TrezorConnectManagement = Type.Object({
    getFirmwareHash: Type.Unsafe<typeof getFirmwareHash>(),
    resetDevice: Type.Unsafe<typeof resetDevice>(),
    loadDevice: Type.Unsafe<typeof loadDevice>(),
    recoveryDevice: Type.Unsafe<typeof recoveryDevice>(),
    wipeDevice: Type.Unsafe<typeof wipeDevice>(),
    backupDevice: Type.Unsafe<typeof backupDevice>(),
    changePin: Type.Unsafe<typeof changePin>(),
    changeWipeCode: Type.Unsafe<typeof changeWipeCode>(),
    changeLanguage: Type.Unsafe<typeof changeLanguage>(),
    applySettings: Type.Unsafe<typeof applySettings>(),
    applyFlags: Type.Unsafe<typeof applyFlags>(),
    authenticateDevice: Type.Unsafe<typeof authenticateDevice>(),
    setBusy: Type.Unsafe<typeof setBusy>(),
    setBrightness: Type.Unsafe<typeof setBrightness>(),
    bleUnpair: Type.Unsafe<typeof bleUnpair>(),
    thpGetCredentials: Type.Unsafe<typeof thpGetCredentials>(),
    thpRemoveCredentials: Type.Unsafe<typeof thpRemoveCredentials>(),
    telemetryGet: Type.Unsafe<typeof telemetryGet>(),
    pingDevice: Type.Unsafe<typeof pingDevice>(),
    getNonce: Type.Unsafe<typeof getNonce>(),
    getSettings: Type.Unsafe<typeof getSettings>(),
});
export type TrezorConnectManagement = Static<typeof TrezorConnectManagement>;
