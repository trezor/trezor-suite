import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type UNIT_ABBREVIATION } from '@suite-common/suite-constants';

import { EventType } from '../constants';

type Attributes = {
    bitcoinUnit: AttributeDef<UNIT_ABBREVIATION>;
};

export const settingsChangeBtcUnitEvent: EventDef<Attributes, EventType.SettingsChangeBtcUnit> = {
    name: EventType.SettingsChangeBtcUnit,
    descriptionTrigger: 'User changes the Bitcoin display unit (BTC, sats) in mobile app settings',
    changelog: [{ version: '23.4.1', notes: 'added' }],

    attributes: {
        bitcoinUnit: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description:
                'The selected Bitcoin unit abbreviation: `BTC` (full Bitcoin) or `sat` (satoshis)',
        },
    },
};
