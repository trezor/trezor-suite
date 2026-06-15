import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { cancel } from './cancel';
import type { dispose } from './dispose';
import type { off } from './off';
import type { on } from './on';
import type { removeAllListeners } from './removeAllListeners';
import type { uiResponse } from './uiResponse';
import type { updateConnectSettings } from './updateConnectSettings';

// Initialization, lifecycle, events, and settings
export const TrezorConnectCore = Type.Object({
    dispose: Type.Unsafe<typeof dispose>(),
    cancel: Type.Unsafe<typeof cancel>(),
    on: Type.Unsafe<typeof on>(),
    off: Type.Unsafe<typeof off>(),
    removeAllListeners: Type.Unsafe<typeof removeAllListeners>(),
    uiResponse: Type.Unsafe<typeof uiResponse>(),
    updateConnectSettings: Type.Unsafe<typeof updateConnectSettings>(),
});
export type TrezorConnectCore = Static<typeof TrezorConnectCore>;
