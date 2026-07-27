import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { EventType } from '../constants';

type Attributes = {
    localCurrency: AttributeDef<BaseCurrencyCode>;
};

export const settingsChangeCurrencyEvent: EventDef<Attributes, EventType.SettingsChangeCurrency> = {
    name: EventType.SettingsChangeCurrency,
    descriptionTrigger:
        'User selects a different fiat currency for price display in mobile app settings',
    changelog: [{ version: '23.4.1', notes: 'added' }],

    attributes: {
        localCurrency: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'The ISO 4217 fiat currency code selected (e.g., `USD`, `EUR`, `GBP`)',
        },
    },
};
