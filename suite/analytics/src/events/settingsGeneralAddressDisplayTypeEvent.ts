import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type SettingsGeneralAddressDisplayTypeEventAddressDisplayType = 'original' | 'chunked';

type Attributes = {
    addressDisplayType: AttributeDef<SettingsGeneralAddressDisplayTypeEventAddressDisplayType>;
};

export const settingsGeneralAddressDisplayTypeEvent: EventDef<
    Attributes,
    EventType.SettingsGeneralAddressDisplayType
> = {
    name: EventType.SettingsGeneralAddressDisplayType,
    descriptionTrigger: 'User changes address display type in settings.',
    changelog: [{ version: '25.10.0', notes: 'added' }],

    attributes: {
        addressDisplayType: {
            changelog: [{ version: '25.10.0', notes: 'added' }],
            description:
                'The selected address display format: `original` for full address display, `chunked` for space-separated address segments for easier reading',
        },
    },
};
