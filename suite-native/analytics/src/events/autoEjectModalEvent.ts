import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type AutoEjectModalValue = 'enable' | 'skip';

type Attributes = {
    value: AttributeDef<AutoEjectModalValue>;
};

export const autoEjectModalEvent: EventDef<Attributes, EventType.AutoEjectModal> = {
    name: EventType.AutoEjectModal,
    descriptionTrigger:
        '1 of 2 options selected in auto eject modal on first device disconnection.',
    changelog: [{ version: '25.8.1', notes: 'Added' }],
    attributes: {
        value: { changelog: [{ version: '25.8.1', notes: 'added' }] },
    },
};
