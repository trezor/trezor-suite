import type { off } from './off';
import type { on } from './on';
import type { removeAllListeners } from './removeAllListeners';
import type { uiResponse } from './uiResponse';
import type { updateConnectSettings } from './updateConnectSettings';

// Initialization, lifecycle, events, and settings
export interface TrezorConnectInternal {
    on: typeof on;
    off: typeof off;
    removeAllListeners: typeof removeAllListeners;
    uiResponse: typeof uiResponse;
    updateConnectSettings: typeof updateConnectSettings;
}
