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
        'Change of bitcoin units in application settings, bitcoin settings in crypto section or by click on bitcoin amount in the account or on the dashboard',
    changelog: [{ version: '1.21.0', notes: 'added' }],

    attributes: {
        unit: {
            changelog: [{ version: '1.21.0', notes: 'added' }],
        },
    },
};
