import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type BackendType, type NetworkSymbol } from '@suite-common/wallet-config';

import { EventType } from '../constants';

type Attributes = {
    symbol: AttributeDef<NetworkSymbol>;
    type: AttributeDef<BackendType | 'default'>;
};

export const settingsChangeCoinBackendEvent: EventDef<
    Attributes,
    EventType.SettingsChangeCoinBackend
> = {
    name: EventType.SettingsChangeCoinBackend,
    descriptionTrigger: 'A user confirms custom backend settings.',
    changelog: [{ version: '26.2.0', notes: 'added' }],
    attributes: {
        symbol: {
            changelog: [{ version: '26.2.0', notes: 'added' }],
        },
        type: {
            changelog: [{ version: '26.2.0', notes: 'added' }],
        },
    },
};
