import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { EventType } from '../constants';

type Attributes = {
    localCurrency: AttributeDef<BaseCurrencyCode>;
};

export const settingsChangeCurrencyEvent: EventDef<Attributes, EventType.SettingsChangeCurrency> = {
    name: EventType.SettingsChangeCurrency,
    descriptionTrigger: 'On changing fiat currency settings.',
    changelog: [{ version: '23.4.1', notes: 'added' }],

    attributes: {
        localCurrency: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'The selected fiat currency code',
        },
    },
};
