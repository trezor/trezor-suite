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
    descriptionTrigger: 'User confirms custom backend settings for a cryptocurrency network',
    changelog: [{ version: '26.2.1', notes: 'added' }],
    attributes: {
        symbol: {
            description:
                'The cryptocurrency network symbol for which the backend is configured (e.g., `btc`, `eth`)',
            changelog: [{ version: '26.2.1', notes: 'added' }],
        },
        type: {
            description:
                'The backend type being configured: `default` for standard backend, or a custom backend type identifier',
            changelog: [{ version: '26.2.1', notes: 'added' }],
        },
    },
};
