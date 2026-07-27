import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    unit: AttributeDef<string>;
};

export const settingsGeneralChangeBitcoinUnitEvent: EventDef<
    Attributes,
    EventType.SettingsGeneralChangeBitcoinUnit
> = {
    name: EventType.SettingsGeneralChangeBitcoinUnit,
    descriptionTrigger:
        'User changes the Bitcoin unit display format via settings, wallet settings, or by clicking the amount display on dashboard/account screens',
    changelog: [{ version: '1.21.0', notes: 'added' }],

    attributes: {
        unit: {
            changelog: [{ version: '1.21.0', notes: 'added' }],
            description:
                'The selected Bitcoin unit abbreviation (e.g., `BTC`, `mBTC`, `μBTC`, `sat`)',
        },
    },
};
