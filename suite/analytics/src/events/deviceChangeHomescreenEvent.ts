import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    source: AttributeDef<'gallery' | 'custom'>;
    image?: AttributeDef<string>;
};

export const deviceChangeHomescreenEvent: EventDef<Attributes, EventType.DeviceChangeHomescreen> = {
    name: EventType.DeviceChangeHomescreen,
    descriptionTrigger:
        'Device successfully applies a new homescreen (background) chosen in Settings > Device > Customization > Homescreen',
    changelog: [{ version: '26.11.0', notes: 'added' }],

    attributes: {
        source: {
            description:
                '`gallery` for an image picked from the built-in gallery, `custom` for an image uploaded by the user',
            changelog: [{ version: '26.11.0', notes: 'added' }],
        },
        image: {
            description:
                'Name of the gallery image (e.g. `aurora`, `original_t3w1`). Names starting with `original_` (and `green`/`orange` on Safe 5) reset to the factory default. Only sent for `gallery`; custom uploads are never described.',
            changelog: [{ version: '26.11.0', notes: 'added' }],
        },
    },
};
