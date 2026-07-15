import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { off } from './off';
import type { on } from './on';
import type { removeAllListeners } from './removeAllListeners';
import type { uiResponse } from './uiResponse';
import type { updateConnectSettings } from './updateConnectSettings';

// Initialization, lifecycle, events, and settings
export const TrezorConnectInternal = Type.Object({
    on: Type.Unsafe<typeof on>(),
    off: Type.Unsafe<typeof off>(),
    removeAllListeners: Type.Unsafe<typeof removeAllListeners>(),
    uiResponse: Type.Unsafe<typeof uiResponse>(),
    updateConnectSettings: Type.Unsafe<typeof updateConnectSettings>(),
});
export type TrezorConnectInternal = Static<typeof TrezorConnectInternal>;
