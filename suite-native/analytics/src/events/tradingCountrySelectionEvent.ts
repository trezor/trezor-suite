import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';
import type { CountryChangeAction, CountryChangeContextCheck } from '../types';

type Attributes = {
    type: AttributeDef<CountryChangeContextCheck>;
    action: AttributeDef<CountryChangeAction>;
};

export const tradingCountrySelectionEvent: EventDef<Attributes, EventType.TradingCountrySelection> =
    {
        name: EventType.TradingCountrySelection,
        descriptionTrigger: 'User selects or changes country (settings or onboarding).',
        changelog: [{ version: '1.0.0', notes: 'added' }],
        attributes: {
            type: { changelog: [{ version: '1.0.0', notes: 'added' }] },
            action: { changelog: [{ version: '1.0.0', notes: 'added' }] },
        },
    };
